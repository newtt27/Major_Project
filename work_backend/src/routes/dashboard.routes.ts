// src/routes/dashboard.routes.ts
import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { hasPermission } from "../middleware/permission.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/stats",
  hasPermission("dashboard:view"),
  dashboardController.getStats
);

export default router;