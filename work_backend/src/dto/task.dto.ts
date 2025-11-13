// src/dto/task.dto.ts
export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: "Low" | "Medium" | "High"
  part_id: number
  is_direct_assignment?: boolean
  required_file_count?: number
  start_date?: string
  due_date?: string
  assigned_users: number[]
  main_assignee_id?: number
}

export interface UpdateTaskDTO {
  title?: string
  description?: string
  priority?: "Low" | "Medium" | "High"
  start_date?: string
  due_date?: string
}

export interface UpdateTaskProgressDTO {
  percentage_complete?: number
  milestone_description?: string
  is_tick_complete?: boolean
}

// ĐÃ SỬA: files không bắt buộc
export interface UploadAttachmentDTO {
  task_id: number
  message?: string
  files?: Express.Multer.File[]  // Không bắt buộc
}