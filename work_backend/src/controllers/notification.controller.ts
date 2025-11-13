// src/controllers/notification.controller.ts
import type { Response } from "express"
import type { AuthenticatedRequest } from "../middleware/auth.middleware"
import notificationService from "../services/notification.services"
import type { NotificationDTO } from "../dto/notification.dto"

class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId
    const unreadOnly = req.query.unread === "true"
    const notifications: NotificationDTO[] = await notificationService.getUserNotifications(userId, unreadOnly)

    const unreadCount = notifications.filter(n => !n.is_read).length

    return res.json({
      success: true,
      data: {
        notifications,
        total: notifications.length,
        unread_count: unreadCount,
      },
    })
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId
    const { notificationId } = req.params

    const notification = await notificationService.markAsRead(Number(notificationId), userId)
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found or access denied" })
    }

    return res.json({ success: true, message: "Marked as read", data: notification })
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId
    const result = await notificationService.markAllAsRead(userId)

    return res.json({
      success: true,
      message: "All notifications marked as read",
      data: { count: result.count },
    })
  }
}

export default new NotificationController()