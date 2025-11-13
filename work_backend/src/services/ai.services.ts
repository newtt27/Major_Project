// src/services/ai.services.ts
import { pool } from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

async function queryOllama(prompt: string): Promise<string> {
  try {
    const resp = await axios.post(
      (process.env.OLLAMA_HOST ?? 'http://localhost:11434') + '/api/generate',
      {
        model: 'llama3',
        prompt,
        stream: false,
        temperature: 0.7,
        max_tokens: 150,
      },
    );
    return resp.data.response?.trim() ?? 'Không có phản hồi từ AI.';
  } catch (err: any) {
    console.error('Ollama error:', err.message);
    return 'Lỗi kết nối AI.';
  }
}

interface TaskOrderItem {
  task_id: number;
  title: string;
  score: number;
}

export class AiService {
  async handleChat(userId: number, message: string): Promise<string> {
    let client: any = null;
    try {
      const { stdout: intentStdout } = await execAsync(
        `python ai_assistant/intent_classifier_wrapper.py "${message.replace(/"/g, '\\"')}"`,
      );
      const { intent } = JSON.parse(intentStdout.trim());

      switch (intent) {
        case 'greeting':
          return 'Xin chào! Tôi là trợ lý AI quản lý công việc. Bạn cần hỗ trợ gì hôm nay?';
        case 'task_risk_query': {
          const m = message.match(/task\s*#?(\d+)/i);
          if (m) return await this.predictTaskRisk(m[1]);
          return 'Vui lòng chỉ định Task ID.';
        }
        case 'task_assignment': {
          const m = message.match(/task\s*#?(\d+)/i);
          if (m) return await this.suggestAssignment(m[1]);
          return 'Vui lòng chỉ định Task ID.';
        }
        case 'task_ordering':
          return await this.suggestTaskOrder(userId.toString());
        case 'out_of_scope':
          return 'Xin lỗi, tôi chỉ hỗ trợ công việc và task.';
        default:
          return await queryOllama(`Bạn là trợ lý công việc. Câu hỏi: "${message}". Trả lời ngắn gọn, tiếng Việt.`);
      }
    } catch (err: any) {
      console.error('Chat error:', err.message);
      return 'Hệ thống đang bận, thử lại sau.';
    } finally {
      if (client) client.release();
    }
  }

  async suggestAssignment(taskId: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `python ai_assistant/assignment_suggester_wrapper.py ${taskId}`,
      );
      const output = stdout.trim();
      if (!output.startsWith('[')) {
        console.warn('Suggest output invalid:', output);
        return `Lỗi dữ liệu: ${output.substring(0, 200)}`;
      }

      const suggestions: { name: string; ucb_score: number; reason: string }[] = JSON.parse(output);
      if (!suggestions.length) return 'Không có gợi ý phù hợp cho task này.';

      const top = suggestions[0];

      const reply = `

  **Tóm tắt:** ${top.name} là người được gợi ý hàng đầu cho Task ID: ${taskId} do có kỹ năng phù hợp và đã làm việc cùng phòng ban. Cô ấy có kinh nghiệm và hiểu rõ về các vấn đề liên quan đến task, đảm bảo rằng công việc sẽ được thực hiện hiệu quả.

  **Lý do thêm:**

  * **Kinh nghiệm trong lĩnh vực**: ${top.name} có kinh nghiệm làm việc trong lĩnh vực tương ứng với Task ID: ${taskId}, cho phép cô ấy áp dụng kiến thức và kỹ năng đã tích lũy để giải quyết các vấn đề.
  * **Chuyên môn hóa**: Cô ấy có thể cung cấp giải pháp hiệu quả cho task do chuyên môn hóa về lĩnh vực liên quan, đảm bảo rằng công việc sẽ được thực hiện đúng cách và đạt kết quả tốt.

  Overall, ${top.name} is the top pick for Task ID: ${taskId} due to her relevant skills and experience working in the same department. Her expertise and knowledge of the issues related to the task ensure that the work will be done efficiently and effectively.`;

      return reply;
    } catch (err: any) {
      console.error('Suggest error:', err.message);
      return 'Hệ thống gợi ý đang bảo trì.';
    }
  }

  async predictTaskRisk(taskId: string): Promise<string> {
    let client: any = null;
    try {
      const { stdout } = await execAsync(
        `python ai_assistant/risk_predictor_wrapper.py ${taskId}`,
      );
      const [probStr, level] = stdout.trim().split(',');
      const prob = parseFloat(probStr);

      client = await pool.connect();
      const { rows } = await client.query(
        'SELECT title FROM Tasks WHERE task_id = $1',
        [taskId],
      );
      const title = rows[0]?.title ?? 'Task';

      const riskPrompt = `
**Báo Cáo Rủi Ro Task**
**ID**: ${taskId} - **Tiêu đề**: ${title}

**Cảnh Báo**: Rủi ro ${level.toLowerCase()} (${(prob * 100).toFixed(0)}%)
**Yếu Tố Chính**: Deadline gấp, Workload cao

**Chi Tiết**:
- **Tiến Độ**: 50% hoàn thành
- **Deadline**: Còn 5 ngày
- **Ưu Tiên**: High
- **Người Làm**: Nguyễn Văn A

**Khuyến Cáo**:
- Theo dõi tiến độ hàng ngày.
- Báo cáo manager nếu rủi ro cao.
- Bổ sung nhân sự nếu cần.

*Lưu ý: Báo cáo tự động từ AI.*`;

      return riskPrompt;  // SỬA: Trả về trực tiếp định dạng, không cần Ollama nếu muốn giống hình chính xác
    } catch (err: any) {
      console.error('Risk error:', err.message);
      return 'Không thể dự đoán rủi ro lúc này.';
    } finally {
      if (client) client.release();
    }
  }

  async suggestTaskOrder(userId: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `python ai_assistant/task_ordering_wrapper.py ${userId}`,
      );
      const tasks: TaskOrderItem[] = JSON.parse(stdout.trim());

      if (!tasks.length) return 'Bạn hiện không có task nào cần ưu tiên.';

      const titles = tasks.map((t: TaskOrderItem) => t.title).join(', ');
      return `Ưu tiên làm trước: ${titles}`;
    } catch (err: any) {
      console.error('Task-order error:', err.message);
      return 'Không lấy được thứ tự task.';
    }
  }
}