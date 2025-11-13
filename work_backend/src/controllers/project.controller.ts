// src/controllers/project.controller.ts
import type { Response } from "express"
import type { AuthenticatedRequest } from "../middleware/auth.middleware"
import { ProjectService } from "../services/project.services"
import { pool } from "../config/database"  // ĐÃ THÊM DÒNG NÀY
import type { CreateProjectDTO, UpdateProjectDTO, CreateProjectPartDTO, UpdateProjectPartDTO } from "../dto/project.dto"

const projectService = new ProjectService()

export class ProjectController {
  async createProject(req: AuthenticatedRequest, res: Response) {
    const data: CreateProjectDTO = req.body
    const result = await projectService.createProject(data, req.user!.userId)
    return res.status(201).json({ message: "Project created", data: result })
  }

  async getProjects(_req: AuthenticatedRequest, res: Response) {
    const result = await projectService.getProjects()
    return res.json({ data: result })
  }

  async getProjectById(req: AuthenticatedRequest, res: Response) {
    const projectId = parseInt(req.params.id)
    const result = await projectService.getProjectById(projectId)
    return res.json({ data: result })
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    const projectId = parseInt(req.params.id)
    const data: UpdateProjectDTO = req.body
    const result = await projectService.updateProject(projectId, data)
    return res.json({ message: "Project updated", data: result })
  }

  async deleteProject(req: AuthenticatedRequest, res: Response) {
    const projectId = parseInt(req.params.id)
    const result = await projectService.deleteProject(projectId)
    return res.json(result)
  }

  async createProjectPart(req: AuthenticatedRequest, res: Response) {
    const data: CreateProjectPartDTO = req.body
    const result = await projectService.createProjectPart(data)
    return res.status(201).json({ message: "Project part created", data: result })
  }

  async getProjectParts(req: AuthenticatedRequest, res: Response) {
    const projectId = parseInt(req.params.projectId)
    const result = await projectService.getProjectParts(projectId)
    return res.json({ data: result })
  }

  async getMyProjectParts(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId
    const userRes = await pool.query("SELECT department_id FROM Users WHERE user_id = $1", [userId])
    const deptId = userRes.rows[0]?.department_id

    const deptParts = deptId ? await projectService.getProjectPartsByDepartment(deptId) : []
    const indParts = await projectService.getProjectPartsByUser(userId)

    return res.json({ data: [...deptParts, ...indParts] })
  }

  async updateProjectPart(req: AuthenticatedRequest, res: Response) {
    const partId = parseInt(req.params.id)
    const data: UpdateProjectPartDTO = req.body
    const result = await projectService.updateProjectPart(partId, data)
    return res.json({ message: "Project part updated", data: result })
  }

  async deleteProjectPart(req: AuthenticatedRequest, res: Response) {
    const partId = parseInt(req.params.id)
    const result = await projectService.deleteProjectPart(partId)
    return res.json(result)
  }
}