// src/routes/notification.routes.ts
import { Router } from "express"
import notificationController from "../controllers/notification.controller"
import { authenticate } from "../middleware/auth.middleware"
import { hasPermission } from "../middleware/permission.middleware"

const router = Router()

router.use(authenticate)

router.get("/", hasPermission("notifications:list"), notificationController.getNotifications)
router.put("/:notificationId/read", hasPermission("notifications:mark-read"), notificationController.markAsRead)
router.put("/read-all", hasPermission("notifications:mark-all-read"), notificationController.markAllAsRead)

export default router