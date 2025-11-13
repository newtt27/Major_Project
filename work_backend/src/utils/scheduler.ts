// src/utils/scheduler.ts
import cron from "node-cron"
import notificationService from "../services/notification.services"

export function startScheduler() {
  // Mỗi giờ kiểm tra công việc quá hạn
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Checking overdue tasks...")
    try {
      const count = await notificationService.checkOverdueTasks()
      console.log(`Sent ${count} overdue notifications`)
    } catch (error) {
      console.error("Overdue check failed:", error)
    }
  })

  // Mỗi 6 tiếng kiểm tra công việc sắp đến hạn
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Scheduler] Checking upcoming deadlines...")
    try {
      const count = await notificationService.checkUpcomingDeadlines()
      console.log(`Sent ${count} reminder notifications`)
    } catch (error) {
      console.error("Reminder check failed:", error)
    }
  })

  console.log("[Scheduler] Notification scheduler started")
}