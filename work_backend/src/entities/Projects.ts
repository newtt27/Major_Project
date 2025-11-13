export interface Project {
  project_id: number
  project_name: string
  description?: string
  status: "Planning" | "Active" | "Completed" | "Inactive"
  created_by: number
  start_date?: Date
  due_date?: Date
  created_at: Date
  updated_at: Date
}

export interface ProjectPart {
  part_id: number
  project_id: number
  part_name: string
  description?: string
  status: "Planning" | "Active" | "Completed" | "Inactive"
  department_id?: number
  assigned_to?: number
  start_date?: Date
  due_date?: Date
  created_at: Date
  updated_at: Date
}
