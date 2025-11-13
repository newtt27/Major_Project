// src/controllers/task.controller.ts
import type { Response } from "express"
import type { AuthenticatedRequest } from "../middleware/auth.middleware"
import { TaskService } from "../services/task.services"
import type { CreateTaskDTO, UpdateTaskDTO, UpdateTaskProgressDTO } from "../dto/task.dto"

const taskService = new TaskService()

export class TaskController {
  async createTask(req: AuthenticatedRequest, res: Response) {
    const data: CreateTaskDTO = req.body
    const result = await taskService.createTask(data, req.user!.userId)
    return res.status(201).json({ message: "Task created", data: result })
  }

  async getMyTasks(req: AuthenticatedRequest, res: Response) {
    const filters = req.query
    const result = await taskService.getMyTasks(req.user!.userId, filters)
    return res.json({ data: result })
  }

  async getTaskById(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const result = await taskService.getTaskById(taskId, req.user!.userId)
    return res.json({ data: result })
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const data: UpdateTaskDTO = req.body
    const result = await taskService.updateTask(taskId, data, req.user!.userId)
    return res.json({ message: "Task updated", data: result })
  }

  async updateTaskProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const data: UpdateTaskProgressDTO = req.body;

      const result = await taskService.updateTaskProgress(taskId, req.user!.userId, data);

      return res.json({
        message: "Progress updated",
        data: result
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
      });
    }
  }

  // ĐÃ SỬA: Truyền files đúng cách
  async uploadAttachments(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const files = req.files as Express.Multer.File[]
    const { message } = req.body

    const result = await taskService.uploadAttachments(
      { task_id: taskId, message },
      req.user!.userId,
      files
    )
    return res.json({ message: "Files uploaded", data: result })
  }

  async getTaskHistory(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const result = await taskService.getTaskHistory(taskId)
    return res.json({ data: result })
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const result = await taskService.deleteTask(taskId)
    return res.json(result)
  }

  async changeMainAssignee(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const { user_id } = req.body
    const result = await taskService.changeMainAssignee(taskId, user_id)
    return res.json({ message: "Main assignee updated", data: result })
  }

  async updateTaskAssignments(req: AuthenticatedRequest, res: Response) {
    const taskId = parseInt(req.params.id)
    const { assigned_users }: { assigned_users: number[] } = req.body
    const result = await taskService.updateTaskAssignments(taskId, assigned_users)
    return res.json({ message: "Assignments updated", data: result })
  }

  // Thêm
  //Thêm
   async getTasksByPartId(req: AuthenticatedRequest, res: Response) {
    try {
      const partId = parseInt(req.params.partId)
      if (isNaN(partId)) return res.status(400).json({ message: "Invalid part ID" })

      const tasks = await taskService.getTasksByPartId(partId)
      return res.json({ data: tasks })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: "Failed to get tasks" })
    }
  }
  // trong TaskController
  async getTaskFullDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID" });

      // Admin hoặc user bình thường đều có thể gọi
      const task = await taskService.getTaskFullDetailById(taskId);
      return res.json({ data: task });
    } catch (err: any) {
      console.error(err);
      return res.status(err.statusCode || 500).json({ message: err.message || "Failed to get task" });
    }
  }
}