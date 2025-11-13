export interface Notification {
  notification_id: number
  task_id?: number
  user_id: number
  message: string
  notification_type: "Reminder" | "Update" | "Overdue"
  priority: "Low" | "Medium" | "High"
  sent_at: Date
  is_read: boolean
  created_at: Date
  updated_at: Date
}
