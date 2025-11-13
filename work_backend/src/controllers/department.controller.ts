// src/controllers/department.controller.ts
import { Request, Response, NextFunction } from "express";
import { departmentService } from "../services/department.services"; // Sửa typo "services" → "service"
import { AppError } from "../middleware/error.middleware";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export class DepartmentController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await departmentService.getAll();
      res.json({ data: departments });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const department = await departmentService.getById(id);
      if (!department) {
        return next(new AppError("Department not found", 404));
      }
      res.json({ data: department });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = req.body;
      const department = await departmentService.create(dto);
      res.status(201).json({ data: department });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dto = req.body;
      const department = await departmentService.update(id, dto);
      if (!department) {
        return next(new AppError("Department not found", 404));
      }
      res.json({ data: department });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const success = await departmentService.delete(id);
      if (!success) {
        return next(new AppError("Department not found or cannot be deleted", 404));
      }
      res.json({ message: "Department deleted successfully" });
    } catch (error) {
      next(error);
    }
  }


 async getMyDepartmentUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
     const userId = req.user?.userId;
     if (!userId) {
       return next(new AppError("Unauthorized: Invalid token", 401));
     }

     try {
       const result = await departmentService.getMyDepartmentUsers(userId);
       res.status(200).json({
         success: true,
         data: result
       });
     } catch (error: any) {
       next(error instanceof AppError ? error : new AppError("Internal server error", 500));
     }
   }
}

export const departmentController = new DepartmentController();