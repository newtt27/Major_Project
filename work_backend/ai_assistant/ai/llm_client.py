# ai/llm_client.py
import re
import ollama
from .db_integration import get_task_context
from .intent_classifier import predict_intent
from .assignment_bandit import suggest_assignee_bandit
from .risk_tgn import predict_risk_advanced
from .task_ordering import suggest_task_order  # Nếu cần thêm cho intent khác

def extract_task_id(text: str) -> int:
    # Bắt số thường
    match = re.search(r'task\s*#?(\d+)', text.lower())
    if match:
        return int(match.group(1))

    # Bắt số bằng chữ (hỗ trợ task 2 = "hai")
    num_map = {"một":1, "hai":2, "ba":3, "bốn":4, "năm":5, "sáu":6, "bảy":7, "tám":8, "chín":9, "mười":10}
    for word, num in num_map.items():
        if word in text.lower():
            return num

    return 1  # default

def generate_response(user_message: str, data: dict, db) -> str:
    # 1. Predict intent
    intent, confidence = predict_intent(user_message)

    # 2. Extract task_id (sử dụng hàm mới)
    task_id = extract_task_id(user_message)

    # 3. Lấy context chung
    context = get_task_context(db, task_id)

    # 4. Xử lý dựa trên intent và gọi hàm tương ứng
    if intent == "task_assignment" and confidence > 0.5:
        suggestions = suggest_assignee_bandit(task_id, db)
        ai_info = "Gợi ý phân công:\n" + "\n".join(
            f"- {s['name']} (score: {s['ucb_score']:.2f}, lý do: {s['reason']})"
            for s in suggestions
        )
    elif intent == "task_risk_query" and confidence > 0.5:
        risk_data = predict_risk_advanced(task_id, db)
        ai_info = f"Rủi ro: {risk_data['risk_score']:.2f} ({risk_data['risk_level']})\nYếu tố: {', '.join(risk_data['top_factors'])}"
    elif intent == "task_ordering" and confidence > 0.5:
        # Giả sử extract user_id từ data hoặc context, ở đây dùng ví dụ user_id=1
        user_id = data.get('user_id', 1)  # Cần adjust theo thực tế
        order_suggestions = suggest_task_order(user_id, db)
        ai_info = "Nên làm trước:\n" + "\n".join(
            f"- Task #{t['task_id']}: {t['title']} (score: {t['score']})"
            for t in order_suggestions
        )
    elif "risk_score" in data:  # Fallback nếu có data sẵn
        ai_info = f"Rủi ro: {data['risk_score']:.2f} (cao nếu >0.7)\nYếu tố: {', '.join(data.get('top_factors', []))}"
    else:
        ai_info = f"Tiến độ: {context.get('progress', 0)}%\nCòn: {context.get('due_in_days', 'N/A')} ngày"

    # 5. Build prompt dynamic
    prompt = f"""
Bạn là trợ lý AI hỗ trợ công việc.
Dữ liệu hệ thống:

Task: {context.get('title', 'N/A')}
Người làm: {context.get('assignee', 'Chưa có')}
Kỹ năng cần: {', '.join(context.get('required_skills', []))}

Kết quả AI ({intent}):
{ai_info}

Câu hỏi: {user_message}

Trả lời bằng tiếng Việt, ngắn gọn, có gợi ý hành động, dùng dấu đầu dòng.
    """.strip()

    try:
        response = ollama.generate(model="llama3:latest", prompt=prompt)
        return response['response'].strip()
    except Exception:
        return "AI đang bận. Thử lại sau nhé!"