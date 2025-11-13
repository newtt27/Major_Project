import type { Response } from "express"
import type { AuthenticatedRequest } from "../middleware/auth.middleware"
import { ChatService } from "../services/chat.services"
import type { CreateChatroomDTO, AddMemberDTO, KickMemberDTO, SendMessageDTO } from "../dto/chat.dto"
import { pool } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import { createReadStream } from "fs"
import { statSync } from "fs"
import path from "path"
const chatService = new ChatService()

export class ChatController {

  async createChatroom(req: AuthenticatedRequest, res: Response) {
    const data: CreateChatroomDTO = req.body
    const result = await chatService.createChatroom(data, req.user!.userId)
    return res.status(201).json({ message: "Created", data: result })
  }

  async getMyChatrooms(req: AuthenticatedRequest, res: Response) {
    const result = await chatService.getMyChatrooms(req.user!.userId)
    return res.json({ data: result })
  }

  async getChatroomById(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id)
    const result = await chatService.getChatroomById(id, req.user!.userId)
    return res.json({ data: result })
  }

  async getMessages(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.chatroomId)
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    const result = await chatService.getMessages(id, req.user!.userId, limit, offset)
    return res.json({ data: result })
  }

  async addMembers(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id)
    const data: AddMemberDTO = req.body
    const result = await chatService.addMembers(id, data, req.user!.userId)
    return res.json(result)
  }

  async kickMember(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id)
    const data: KickMemberDTO = { user_id: parseInt(req.params.userId) }
    const result = await chatService.kickMember(id, data, req.user!.userId)
    return res.json(result)
  }

  async getMembers(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id)
    const result = await chatService.getMembers(id, req.user!.userId)
    return res.json({ data: result })
  }

  async sendMessageWithAttachment(req: AuthenticatedRequest, res: Response) {
    const chatroomId = Number(req.params.id)
    const { message_text } = req.body as { message_text?: string }
    const files = (req.files as Express.Multer.File[] | undefined) ?? []

    const data: SendMessageDTO = {
      chatroom_id: chatroomId,
      message_text: message_text?.trim() || undefined,
    }

    const fileInfos = files.map(file => ({
      filename: file.originalname,
      path: file.path, // giữ path Multer đúng
      mimetype: file.mimetype,
      size: file.size,
    }))

    try {
      const message = await chatService.sendMessage(data, req.user!.userId, fileInfos)

      // Emit realtime
      const io = req.app.get("io") as import("socket.io").Server | undefined
      if (io) io.to(`room_${chatroomId}`).emit("new_message", message)

      return res.status(201).json({ success: true, data: message })
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message || "Internal server error" })
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const id = parseInt(req.params.id)
    try {
      await chatService.markAsRead(id, req.user!.userId)
      return res.json({ message: "Marked as read" })
    } catch (error: any) {
      return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" })
    }
  }
async downloadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const attachmentId = parseInt(req.params.attachmentId)
  const chatroomId = parseInt(req.params.chatroomId)
  const userId = req.user!.userId

  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT a.file_path, a.file_name, a.mime_type
       FROM Attachments a
       JOIN Messages m ON a.message_id = m.message_id
       JOIN ChatroomMembers cm ON m.chatroom_id = cm.chatroom_id
       WHERE a.attachment_id = $1
         AND m.chatroom_id = $2
         AND cm.user_id = $3
         AND a.task_id IS NULL`,
      [attachmentId, chatroomId, userId]
    )

    if (!result.rows.length) {
      throw new AppError("File not found or access denied", 404)
    }
      const { file_path, file_name, mime_type } = result.rows[0]
      const absolutePath = path.resolve(file_path)

      try {
        const stats = statSync(absolutePath)
        if (!stats.isFile()) throw new Error()
      } catch {
        throw new AppError("File not found on server", 404)
      }

      res.setHeader("Content-Type", mime_type || "application/octet-stream")
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file_name)}"`)

      const fileStream = createReadStream(absolutePath)
      fileStream.pipe(res)
      // Không cần return vì pipe đã xử lý response
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message })
      } else {
        res.status(500).json({ error: "Failed to download file" })
      }
    } finally {
      client.release()
    }
  }
}
