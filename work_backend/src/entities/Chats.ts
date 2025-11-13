export interface Chatroom {
  chatroom_id: number
  chatroom_name: string
  description?: string
  chatroom_type: "Private" | "Group"
  created_by?: number
  created_at: Date
  updated_at: Date
}

export interface ChatroomMember {
  chatroom_id: number
  user_id: number
  joined_at: Date
  role: "Admin" | "Member"
  created_at: Date
  updated_at: Date
}

export interface Message {
  message_id: number
  chatroom_id: number
  sender_id: number
  receiver_id?: number
  message_text: string
  sent_at: Date
  is_read: boolean
  created_at: Date
  updated_at: Date
}

export interface Attachment {
  attachment_id: number
  message_id: number
  chatroom_id?: number
  task_id?: number
  file_name: string
  file_path: string
  mime_type?: string
  file_size?: number
  uploaded_by: number
  uploaded_at: Date
  updated_at: Date
}
