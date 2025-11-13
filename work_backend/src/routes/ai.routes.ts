// src/routes/ai.routes.ts
import { Router, type Request, type Response } from 'express';
import { authenticate, authorize } from "../middleware/auth.middleware"
import { hasPermission } from '../middleware/permission.middleware';
import { validateDto } from '../middleware/validation.middleware';
import { ChatMessageDto } from '../dto/ai.dto';
import { AiService } from '../services/ai.services';

const router = Router();

// Tạo instance service (DI thủ công, an toàn)
const aiService = new AiService();

// Helper để trả JSON + lỗi
const handle = (fn: (req: Request, res: Response) => Promise<any>) =>
  async (req: Request, res: Response) => {
    try {
      const result = await fn(req, res);
      res.json(result);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Lỗi server' });
    }
  };

// ==================================================================
// 1. CHAT: Ai cũng dùng được
// ==================================================================
router.post(
  '/chat',
  authenticate,
  validateDto(ChatMessageDto),
  hasPermission('ai:chatbot'),
  handle(async (req: Request) => {
    const userId = (req as any).user.userId;
    const { message } = req.body;
    const reply = await aiService.handleChat(userId, message);
    return { reply };
  })
);

// ==================================================================
// 2. GỢI Ý PHÂN CÔNG: Chỉ Admin + Manager
// ==================================================================
router.post(
  '/suggest',
  authenticate,
  authorize("admin", "manager"),
  hasPermission('ai:suggest-assignment'),
  handle(async (req: Request) => {
    const { taskId } = req.body;
    if (!taskId) throw new Error('Thiếu taskId');
    const reply = await aiService.suggestAssignment(taskId);
    return { reply };
  })
);

// ==================================================================
// 3. DỰ ĐOÁN RỦI RO: Chỉ Admin + Manager
// ==================================================================
router.post(
  '/risk',
  authenticate,
  authorize("admin", "manager"),
  hasPermission('ai:predict-risk'),
  handle(async (req: Request) => {
    const { taskId } = req.body;
    if (!taskId) throw new Error('Thiếu taskId');
    const reply = await aiService.predictTaskRisk(taskId);
    return { reply };
  })
);

export default router;