// src/dto/notification.dto.ts

export interface CreateNotificationDTO {
  task_id?: number;
  report_id?: number; // Liên kết với báo cáo
  user_id: number;
  message: string;
  // ĐÃ THÊM "New" để dùng khi gửi báo cáo mới
  notification_type: "Reminder" | "Update" | "Overdue" | "New";
  priority: "Low" | "Medium" | "High";
}

export interface NotificationDTO {
  notification_id: number;
  task_id?: number;
  report_id?: number;
  user_id: number;
  message: string;
  notification_type: "Reminder" | "Update" | "Overdue" | "New";
  priority: "Low" | "Medium" | "High";
  is_read: boolean;
  sent_at: string;
  created_at: string;
  updated_at: string;
  task_title?: string;
  report_title?: string;
}