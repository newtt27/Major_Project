// src/services/project.services.ts
import { query } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import type {
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateProjectPartDTO,
  UpdateProjectPartDTO,
} from "../dto/project.dto"

export class ProjectService {
  async createProject(data: CreateProjectDTO, createdBy: number) {
    if (data.start_date && data.due_date && data.start_date > data.due_date) {
      throw new AppError("start_date must be <= due_date", 400)
    }

    const result = await query(
      `INSERT INTO Projects (project_name, description, start_date, due_date, created_by, status)
       VALUES ($1, $2, $3, $4, $5, 'Planning')
       RETURNING *`,
      [data.project_name, data.description, data.start_date, data.due_date, createdBy]
    )
    return result.rows[0]
  }

  async getProjects() {
    const result = await query(
      `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM Projects p
       JOIN Users u ON p.created_by = u.user_id
       ORDER BY p.created_at DESC`
    )
    return result.rows
  }

  async getProjectById(projectId: number) {
    const result = await query(
      `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM Projects p
       JOIN Users u ON p.created_by = u.user_id
       WHERE p.project_id = $1`,
      [projectId]
    )
    if (!result.rows.length) throw new AppError("Project not found", 404)
    return result.rows[0]
  }

  async updateProject(projectId: number, data: UpdateProjectDTO) {
    if (data.start_date && data.due_date && data.start_date > data.due_date) {
      throw new AppError("start_date must be <= due_date", 400)
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.project_name) { fields.push(`project_name = $${idx++}`); values.push(data.project_name) }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description) }
    if (data.status) { fields.push(`status = $${idx++}`); values.push(data.status) }
    if (data.start_date) { fields.push(`start_date = $${idx++}`); values.push(data.start_date) }
    if (data.due_date) { fields.push(`due_date = $${idx++}`); values.push(data.due_date) }

    if (fields.length === 0) throw new AppError("No fields to update", 400)

    values.push(projectId)
    const result = await query(
      `UPDATE Projects SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $${idx}
       RETURNING *`,
      values
    )
    if (!result.rows.length) throw new AppError("Project not found", 404)
    return result.rows[0]
  }

  async deleteProject(projectId: number) {
    const result = await query("DELETE FROM Projects WHERE project_id = $1 RETURNING project_id", [projectId])
    if (!result.rows.length) throw new AppError("Project not found", 404)
    return { message: "Project deleted" }
  }

  async createProjectPart(data: CreateProjectPartDTO) {
    if (data.department_id && data.assigned_to) {
      throw new AppError("Cannot assign to both department and individual", 400)
    }
    if (data.start_date && data.due_date && data.start_date > data.due_date) {
      throw new AppError("start_date must be <= due_date", 400)
    }

    const result = await query(
      `INSERT INTO ProjectParts
       (project_id, part_name, description, department_id, assigned_to, start_date, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Planning')
       RETURNING *`,
      [
        data.project_id,
        data.part_name,
        data.description,
        data.department_id || null,
        data.assigned_to || null,
        data.start_date,
        data.due_date,
      ]
    )
    return result.rows[0]
  }

  async getProjectParts(projectId: number) {
    const result = await query("SELECT * FROM ProjectParts WHERE project_id = $1 ORDER BY created_at", [projectId])
    return result.rows
  }

  async getProjectPartsByDepartment(departmentId: number) {
    const result = await query(
      "SELECT pp.* FROM ProjectParts pp WHERE pp.department_id = $1 AND pp.status != 'Inactive'",
      [departmentId]
    )
    return result.rows
  }

  async getProjectPartsByUser(userId: number) {
    const result = await query(
      "SELECT pp.* FROM ProjectParts pp WHERE pp.assigned_to = $1 AND pp.status != 'Inactive'",
      [userId]
    )
    return result.rows
  }

  async updateProjectPart(partId: number, data: UpdateProjectPartDTO) {
    if (data.department_id && data.assigned_to) {
      throw new AppError("Cannot assign to both department and individual", 400)
    }
    if (data.start_date && data.due_date && data.start_date > data.due_date) {
      throw new AppError("start_date must be <= due_date", 400)
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.part_name) { fields.push(`part_name = $${idx++}`); values.push(data.part_name) }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description) }
    if (data.status) { fields.push(`status = $${idx++}`); values.push(data.status) }
    if (data.department_id !== undefined) { fields.push(`department_id = $${idx++}`); values.push(data.department_id) }
    if (data.assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(data.assigned_to) }
    if (data.start_date) { fields.push(`start_date = $${idx++}`); values.push(data.start_date) }
    if (data.due_date) { fields.push(`due_date = $${idx++}`); values.push(data.due_date) }

    if (fields.length === 0) throw new AppError("No fields to update", 400)

    values.push(partId)
    const result = await query(
      `UPDATE ProjectParts SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE part_id = $${idx}
       RETURNING *`,
      values
    )
    if (!result.rows.length) throw new AppError("Project part not found", 404)
    return result.rows[0]
  }

  async deleteProjectPart(partId: number) {
    const result = await query("DELETE FROM ProjectParts WHERE part_id = $1 RETURNING part_id", [partId])
    if (!result.rows.length) throw new AppError("Project part not found", 404)
    return { message: "Project part deleted" }
  }
}