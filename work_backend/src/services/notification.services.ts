// src/services/notification.services.ts (Cập nhật để hỗ trợ report_id)
import { pool } from "../config/database"
import { CreateNotificationDTO, NotificationDTO } from "../dto/notification.dto"
import nodemailer from "nodemailer"
import { emitNotificationToUser } from "../websocket/notification.handler"
import type { Server as SocketIOServer } from "socket.io"
import { AppError } from "../middleware/error.middleware"

let io: SocketIOServer | null = null

export class NotificationService {
  setNotificationIO(socketIO: SocketIOServer): void {
    io = socketIO
  }

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  })

  async createNotification(data: CreateNotificationDTO): Promise<NotificationDTO> {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const result = await client.query<NotificationDTO>(
        `INSERT INTO Notifications
         (task_id, report_id, user_id, message, notification_type, priority, is_read, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, CURRENT_TIMESTAMP)
         RETURNING *`,
        [data.task_id || null, data.report_id || null, data.user_id, data.message, data.notification_type, data.priority]
      )

      const notification = result.rows[0]

      const userEmail = await this.getUserEmail(data.user_id)
      if (userEmail) {
        await this.sendEmail(userEmail, data, notification)
      }

      if (io) {
        emitNotificationToUser(io, data.user_id, notification)
      }

      await client.query("COMMIT")
      return notification
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Create notification error:", error)
      throw new AppError('Lỗi khi tạo thông báo', 500)
    } finally {
      client.release()
    }
  }

  private async getUserEmail(userId: number): Promise<string | null> {
    const res = await pool.query('SELECT email FROM Accounts WHERE user_id = $1', [userId])
    return res.rows[0]?.email || null
  }

private async sendEmail(to: string, data: CreateNotificationDTO, notification: NotificationDTO) {
  // 1. Xác định 'from' an toàn
  const fromEmail = process.env.SMTP_USER || 'no-reply@workapp.local';

  const mailOptions = {
    from: fromEmail,
    to,
    subject: `[Thông báo] ${data.notification_type}`,
    text: `${data.message}\n\nThời gian: ${notification.sent_at}\n\nID: ${notification.notification_id}`,
  };

  try {
    await this.transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Gửi thành công đến: ${to}`);
  } catch (error: any) {
    // KHÔNG crash hệ thống – chỉ log lỗi
    console.warn(`[EMAIL] Gửi thất bại đến ${to}:`, error.message);
    // Trong dev với MailHog: lỗi này thường không xảy ra
  }
}
  async getUserNotifications(userId: number, unreadOnly: boolean): Promise<NotificationDTO[]> {
    const queryText = `
      SELECT n.*, t.title AS task_title, r.title AS report_title
      FROM Notifications n
      LEFT JOIN Tasks t ON n.task_id = t.task_id
      LEFT JOIN Reports r ON n.report_id = r.report_id
      WHERE n.user_id = $1
      ${unreadOnly ? 'AND n.is_read = FALSE' : ''}
      ORDER BY n.sent_at DESC
      LIMIT 50
    `;
    const res = await pool.query(queryText, [userId]);
    return res.rows;
  }

  async markAsRead(notificationId: number, userId: number): Promise<NotificationDTO | null> {
    const res = await pool.query(`
      UPDATE Notifications
      SET is_read = TRUE
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);
    return res.rows[0] || null;
  }

  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const res = await pool.query(`
      UPDATE Notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `, [userId]);
    return { count: res.rowCount ?? 0 };
  }

  async checkOverdueTasks(): Promise<number> {
    const res = await pool.query(`
      SELECT DISTINCT t.task_id, t.title, ta.user_id
      FROM Tasks t
      JOIN TaskAssignments ta ON t.task_id = ta.task_id
      JOIN TaskStatuses ts ON t.task_id = ts.task_id AND ts.is_current = TRUE
      WHERE t.due_date < NOW()
        AND ts.status_name NOT IN ('done', 'archived')
        AND NOT EXISTS (
          SELECT 1 FROM Notifications n
          WHERE n.task_id = t.task_id
            AND n.user_id = ta.user_id
            AND n.notification_type = 'Overdue'
            AND n.sent_at > NOW() - INTERVAL '23 hours'
        )
    `)

    let count = 0
    for (const row of res.rows) {
      await this.createNotification({
        task_id: row.task_id,
        user_id: row.user_id,
        message: `Công việc "${row.title}" đã quá hạn! Vui lòng xử lý ngay.`,
        notification_type: "Overdue",
        priority: "High",
      })
      count++
    }
    return count
  }

  async checkUpcomingDeadlines(): Promise<number> {
    const res = await pool.query(`
      SELECT DISTINCT t.task_id, t.title, ta.user_id, t.due_date
      FROM Tasks t
      JOIN TaskAssignments ta ON t.task_id = ta.task_id
      JOIN TaskStatuses ts ON t.task_id = ts.task_id AND ts.is_current = TRUE
      WHERE t.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND ts.status_name NOT IN ('done', 'archived')
        AND NOT EXISTS (
          SELECT 1 FROM Notifications n
          WHERE n.task_id = t.task_id
            AND n.user_id = ta.user_id
            AND n.notification_type = 'Reminder'
            AND n.sent_at > NOW() - INTERVAL '12 hours'
        )
    `)

    let count = 0
    for (const row of res.rows) {
      const hoursLeft = Math.ceil((new Date(row.due_date).getTime() - Date.now()) / 3600000)
      await this.createNotification({
        task_id: row.task_id,
        user_id: row.user_id,
        message: `Công việc "${row.title}" sẽ đến hạn trong ${hoursLeft} giờ nữa!`,
        notification_type: "Reminder",
        priority: "Medium",
      })
      count++
    }
    return count
  }

  // PUBLIC: Dùng ở report.services.ts
  async getManagerId(staffId: number): Promise<number | null> {
    const res = await pool.query(`
      SELECT u.user_id
      FROM Users u
      JOIN Users s ON u.department_id = s.department_id
      WHERE s.user_id = $1
        AND u.position ILIKE '%manager%'
      LIMIT 1
    `, [staffId]);
    return res.rows[0]?.user_id || null;
  }

  async getAdminIds(): Promise<number[]> {
    const res = await pool.query(`
      SELECT u.user_id
      FROM Users u
      JOIN Accounts a ON u.user_id = a.user_id
      WHERE a.role = 'admin'
    `);
    return res.rows.map(r => r.user_id);
  }
}

export default new NotificationService()