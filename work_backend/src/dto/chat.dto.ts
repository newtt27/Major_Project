// src/dto/chat.dto.ts
export interface CreateChatroomDTO {
  chatroom_name: string
  description?: string
  chatroom_type: "Private" | "Group"
  member_ids: number[]
}

export interface SendMessageDTO {
  chatroom_id: number
  message_text?: string // Cho phép null nếu chỉ gửi file
  receiver_id?: number
}

// Cấu trúc cho một Attachment được trả về (Sử dụng tên trường quen thuộc trong JS)
export interface AttachmentResponse {
  attachment_id: number
  filename: string // Tương ứng với cột file_name
  filepath: string // Tương ứng với cột file_path
  mimetype: string // Tương ứng với cột mime_type
  filesize: number // Tương ứng với cột file_size
  uploaded_by: number
  uploaded_at: Date // Tương ứng với cột uploaded_at
}

// Cấu trúc cho một Message được trả về
export interface MessageResponse {
  message_id: number
  chatroom_id: number
  sender_id: number
  receiver_id: number | null
  message_text: string | null
  sent_at: Date
  is_read: boolean
  attachments: AttachmentResponse[] // Trường mới
}

export interface AddMemberDTO {
  user_ids: number[]
}

export interface KickMemberDTO {
  user_id: number
}