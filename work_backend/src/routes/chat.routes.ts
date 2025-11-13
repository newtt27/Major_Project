// src/routes/chat.routes.ts
import { Router, Request, Response, NextFunction } from "express" // Đảm bảo import các kiểu dữ liệu
import { ChatController } from "../controllers/chat.controller"
import { authenticate, authorize } from "../middleware/auth.middleware"
import { hasPermission } from "../middleware/permission.middleware"
import { body, param } from "express-validator"
import { validate } from "../middleware/validation.middleware"
import { upload } from "../middleware/upload.middleware"
import { AppError } from "../middleware/error.middleware" // Đảm bảo import AppError

const router = Router()
const ctrl = new ChatController()

router.use(authenticate)

router.post(
  "/",
  authorize("admin", "manager"),
  hasPermission("chat:create-room"),
  [
    body("chatroom_name").notEmpty(),
    body("chatroom_type").isIn(["Private", "Group"]),
    body("member_ids").isArray({ min: 1 }),
    validate,
  ],
  ctrl.createChatroom
)

router.get("/", hasPermission("chat:list"), ctrl.getMyChatrooms)
router.get("/:id", hasPermission("chat:read"), ctrl.getChatroomById)
router.get("/:chatroomId/messages", hasPermission("chat:messages:read"), ctrl.getMessages)

router.post(
  "/:id/messages",
  hasPermission("chat:messages:create"),
  upload.array("files", 10), // 'attachments' là tên trường FormData
  [
    param("id").isInt().toInt(),
    body("message_text").optional().isString().trim(),

    // Kiểm tra: message_text HOẶC attachments phải có
    (req: Request, _res: Response, next: NextFunction) => {
        const files = req.files as Express.Multer.File[] | undefined
        if (!req.body.message_text && (!files || files.length === 0)) {
            return next(new AppError("Message text or file attachment is required", 400))
        }
        next()
    },
    validate
  ],
  ctrl.sendMessageWithAttachment
)

router.post(
  "/:id/members",
  hasPermission("chat:add-members"),
  [body("user_ids").isArray({ min: 1 }), validate],
  ctrl.addMembers
)
router.delete(
  "/:id/members/:userId",
  hasPermission("chat:kick-member"),
  [param("userId").isInt(), validate],
  ctrl.kickMember
)
router.get("/:id/members", hasPermission("chat:members:list"), ctrl.getMembers)

router.put(
  "/:id/read",
  hasPermission("chat:messages:read"),  // Reuse permission nếu có
  [param("id").isInt().toInt(), validate],
  ctrl.markAsRead  // Hàm mới ở controller
)

router.get(
  "/:chatroomId/attachments/:attachmentId/download",
  hasPermission("chat:messages:read"),
  ctrl.downloadAttachment
)
export default router