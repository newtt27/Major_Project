import { pool } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import type {
  CreateChatroomDTO,
  SendMessageDTO,
  AddMemberDTO,
  KickMemberDTO,
  MessageResponse,
} from "../dto/chat.dto"

// Interface cho dữ liệu file từ Multer
interface FileInfo {
  filename: string // file_name
  path: string // file_path
  mimetype: string // mime_type
  size: number // file_size
}

export class ChatService {

  async createChatroom(data: CreateChatroomDTO, createdBy: number) {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      if (data.chatroom_type === "Private" && data.member_ids.length !== 1) {
        throw new AppError("Private chatroom must have exactly 1 other member", 400)
      }
      if (data.chatroom_type === "Group" && data.member_ids.length < 1) {
        throw new AppError("Group must have at least 1 member", 400)
      }

      const res = await client.query(
        `INSERT INTO Chatrooms (chatroom_name, description, chatroom_type, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.chatroom_name, data.description, data.chatroom_type, createdBy]
      )
      const chatroomId = res.rows[0].chatroom_id

      await client.query(
        "INSERT INTO ChatroomMembers (chatroom_id, user_id, role) VALUES ($1, $2, 'Admin')",
        [chatroomId, createdBy]
      )

      for (const userId of data.member_ids) {
        await client.query(
          "INSERT INTO ChatroomMembers (chatroom_id, user_id, role) VALUES ($1, $2, 'Member') ON CONFLICT DO NOTHING",
          [chatroomId, userId]
        )
      }

      await client.query("COMMIT")
      return res.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async getMyChatrooms(userId: number) {
    const result = await pool.query(
      `SELECT c.*,
          cm.role AS user_role,
          COUNT(DISTINCT cm2.user_id) AS member_count,
          (SELECT COUNT(*) FROM Messages m WHERE m.chatroom_id = c.chatroom_id AND m.is_read = FALSE AND m.sender_id != $1) AS unread_count
        FROM Chatrooms c
        JOIN ChatroomMembers cm ON c.chatroom_id = cm.chatroom_id
        LEFT JOIN ChatroomMembers cm2 ON c.chatroom_id = cm2.chatroom_id
        WHERE cm.user_id = $1
        GROUP BY c.chatroom_id, cm.role
        ORDER BY c.updated_at DESC`,
      [userId]
    )
    return result.rows
  }

  // Trợ giúp lấy message kèm attachments
  async getMessageWithAttachments(messageId: number): Promise<MessageResponse> {
    const messageRes = await pool.query(
      `SELECT message_id, chatroom_id, sender_id, receiver_id, message_text, sent_at, is_read
       FROM Messages WHERE message_id = $1`,
      [messageId]
    )
    const message = messageRes.rows[0]

    const attachmentsRes = await pool.query(
      `SELECT attachment_id, file_name, file_path, mime_type, file_size, uploaded_by, uploaded_at
       FROM Attachments
       WHERE message_id = $1 AND task_id IS NULL`,
      [messageId]
    )

    return {
      ...message,
      attachments: attachmentsRes.rows.map(row => ({
        attachment_id: row.attachment_id,
        filename: row.file_name,
        filepath: row.file_path,
        mimetype: row.mime_type,
        filesize: row.file_size,
        uploaded_by: row.uploaded_by,
        uploaded_at: row.uploaded_at,
      })),
    }
  }

  async sendMessage(
    data: SendMessageDTO,
    senderId: number,
    files?: FileInfo[]
  ): Promise<MessageResponse> {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Kiểm tra member
      const memberCheck = await client.query(
        "SELECT 1 FROM ChatroomMembers WHERE chatroom_id = $1 AND user_id = $2",
        [data.chatroom_id, senderId]
      )
      if (!memberCheck.rows.length) throw new AppError("You are not a member of this chatroom", 403)

      if (!data.message_text && (!files || files.length === 0))
        throw new AppError("Message text or file attachment is required", 400)

      // Insert message
      const messageRes = await client.query(
        `INSERT INTO Messages (chatroom_id, sender_id, receiver_id, message_text)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.chatroom_id, senderId, data.receiver_id || null, data.message_text || null]
      )
      const messageId = messageRes.rows[0].message_id

      // Insert attachments
      if (files && files.length > 0) {
        for (const file of files) {
          await client.query(
            `INSERT INTO Attachments
               (message_id, chatroom_id, task_id, file_name, file_path, mime_type, file_size, uploaded_by)
             VALUES ($1,$2,NULL,$3,$4,$5,$6,$7)`,
            [messageId, data.chatroom_id, file.filename, file.path, file.mimetype, file.size, senderId]
          )
        }
      }

      // Cập nhật chatroom updated_at
      await client.query(
        `UPDATE Chatrooms SET updated_at = CURRENT_TIMESTAMP WHERE chatroom_id = $1`,
        [data.chatroom_id]
      )

      await client.query("COMMIT")

      return await this.getMessageWithAttachments(messageId)
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async getMessages(chatroomId: number, userId: number, limit: number, offset: number): Promise<MessageResponse[]> {
    const memberCheck = await pool.query(
      "SELECT 1 FROM ChatroomMembers WHERE chatroom_id = $1 AND user_id = $2",
      [chatroomId, userId]
    )
    if (!memberCheck.rows.length) throw new AppError("Access denied", 403)

    const result = await pool.query(
      `SELECT
        m.message_id, m.chatroom_id, m.sender_id, m.receiver_id, m.message_text, m.sent_at, m.is_read,
        COALESCE(
          json_agg(
            json_build_object(
              'attachment_id', a.attachment_id,
              'filename', a.file_name,
              'filepath', a.file_path,
              'mimetype', a.mime_type,
              'filesize', a.file_size,
              'uploaded_by', a.uploaded_by,
              'uploaded_at', a.uploaded_at
            ) ORDER BY a.uploaded_at
          ) FILTER (WHERE a.attachment_id IS NOT NULL AND a.task_id IS NULL), '[]'
        ) AS attachments
       FROM Messages m
       LEFT JOIN Attachments a ON m.message_id = a.message_id
       WHERE m.chatroom_id = $1
       GROUP BY m.message_id
       ORDER BY m.sent_at DESC
       LIMIT $2 OFFSET $3`,
      [chatroomId, limit, offset]
    )

    return result.rows.map(row => ({
      ...row,
      attachments: row.attachments.map((att: any) => ({
        attachment_id: att.attachment_id,
        filename: att.filename,
        filepath: att.filepath,
        mimetype: att.mimetype,
        filesize: att.filesize,
        uploaded_by: att.uploaded_by,
        uploaded_at: new Date(att.uploaded_at),
      })),
    })) as MessageResponse[]
  }

  // Các hàm khác giữ nguyên
  async getChatroomById(chatroomId: number, userId: number) {
    const result = await pool.query(
      `SELECT c.*, cm.role AS user_role
       FROM Chatrooms c
       JOIN ChatroomMembers cm ON c.chatroom_id = cm.chatroom_id
       WHERE c.chatroom_id = $1 AND cm.user_id = $2`,
      [chatroomId, userId]
    )
    if (!result.rows.length) throw new AppError("Chatroom not found or access denied", 404)
    return result.rows[0]
  }

  async addMembers(chatroomId: number, data: AddMemberDTO, requesterId: number) {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      const check = await client.query(
        "SELECT 1 FROM ChatroomMembers WHERE chatroom_id = $1 AND user_id = $2 AND role = 'Admin'",
        [chatroomId, requesterId]
      )
      if (!check.rows.length) throw new AppError("Only admin can add members", 403)

      for (const userId of data.user_ids) {
        await client.query(
          "INSERT INTO ChatroomMembers (chatroom_id, user_id, role) VALUES ($1, $2, 'Member') ON CONFLICT DO NOTHING",
          [chatroomId, userId]
        )
      }

      await client.query(
        "UPDATE Chatrooms SET updated_at = CURRENT_TIMESTAMP WHERE chatroom_id = $1",
        [chatroomId]
      )
      await client.query("COMMIT")
      return { message: "Members added" }
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async kickMember(chatroomId: number, data: KickMemberDTO, requesterId: number) {
    const check = await pool.query(
      "SELECT 1 FROM ChatroomMembers WHERE chatroom_id = $1 AND user_id = $2 AND role = 'Admin'",
      [chatroomId, requesterId]
    )
    if (!check.rows.length) throw new AppError("Only admin can kick", 403)

    const result = await pool.query(
      "DELETE FROM ChatroomMembers WHERE chatroom_id = $1 AND user_id = $2 AND user_id != $3 RETURNING *",
      [chatroomId, data.user_id, requesterId]
    )
    if (!result.rows.length) throw new AppError("Member not found or cannot kick self", 404)

    await pool.query(
      "UPDATE Chatrooms SET updated_at = CURRENT_TIMESTAMP WHERE chatroom_id = $1",
      [chatroomId]
    )

    return { message: "Member removed" }
  }

  async getMembers(chatroomId: number, userId: number) {
    const check = await pool.query(
      "SELECT 1 FROM ChatroomMembers WHERE chatroom_id = $1 AND user_id = $2",
      [chatroomId, userId]
    )
    if (!check.rows.length) throw new AppError("Access denied", 403)

    const result = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.position, cm.role, cm.joined_at
       FROM ChatroomMembers cm
       JOIN Users u ON cm.user_id = u.user_id
       WHERE cm.chatroom_id = $1
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      [chatroomId]
    )
    return result.rows
  }

  async markAsRead(chatroomId: number, userId: number) {
    await this.getChatroomById(chatroomId, userId)

    await pool.query(
      `UPDATE Messages
       SET is_read = true
       WHERE chatroom_id = $1
         AND sender_id != $2
         AND is_read = false`,
      [chatroomId, userId]
    )

//     await pool.query(
//       `UPDATE Chatrooms SET updated_at = CURRENT_TIMESTAMP WHERE chatroom_id = $1`,
//       [chatroomId]
//     )
  }
}
