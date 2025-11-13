// src/dto/project.dto.ts
export interface CreateProjectDTO {
  project_name: string
  description?: string
  start_date?: string // ISO string
  due_date?: string
}

export interface UpdateProjectDTO {
  project_name?: string
  description?: string
  status?: "Planning" | "Active" | "Completed" | "Inactive"
  start_date?: string
  due_date?: string
}

export interface CreateProjectPartDTO {
  project_id: number
  part_name: string
  description?: string
  department_id?: number
  assigned_to?: number // user_id
  start_date?: string
  due_date?: string
}

export interface UpdateProjectPartDTO {
  part_name?: string
  description?: string
  status?: "Planning" | "Active" | "Completed" | "Inactive"
  department_id?: number
  assigned_to?: number
  start_date?: string
  due_date?: string
}