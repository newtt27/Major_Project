export interface Task {
  task_id: number
  title: string
  description?: string
  priority: "Low" | "Medium" | "High"
  priority_order: number
  created_by: number
  assigned_by: number
  part_id?: number
  is_direct_assignment: boolean
  required_file_count: number
  start_date?: Date
  due_date?: Date
  created_at: Date
  updated_at: Date
}

export interface TaskAssignment {
  assignment_id: number
  task_id: number
  user_id: number
  assigned_at: Date
  is_main_assignee: boolean
}

export interface TaskStatus {
  status_id: number
  task_id: number
  status_name: "pending" | "in_progress" | "review" | "done" | "archived"
  description?: string
  is_current: boolean
  updated_at: Date
  updated_by?: number
}

export interface TaskProgress {
  progress_id: number
  task_id: number
  user_id: number
  percentage_complete: number
  milestone_description?: string
  is_tick_complete: boolean
  tick_reverted: boolean
  updated_at: Date
}

export interface TaskHistory {
  history_id: number
  task_id: number
  user_id: number
  status_id?: number
  action: string
  old_percentage_complete?: number
  new_percentage_complete?: number
  status_after_update?: string
  created_at: Date
}

