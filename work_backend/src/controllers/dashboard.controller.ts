// src/controllers/dashboard.controller.ts
import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { DashboardService } from "../services/dashboard.services";
import { AppError } from "../middleware/error.middleware";

const dashboardService = new DashboardService();

export class DashboardController {
  getStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await dashboardService.getStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw new AppError("Failed to fetch dashboard stats", 500);
    }
  };
}

export const dashboardController = new DashboardController();