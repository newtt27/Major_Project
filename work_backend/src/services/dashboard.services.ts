// src/services/dashboard.service.ts
import { pool } from "../config/database";
import { DashboardStats } from "../dto/dashboard.dto";

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const client = await pool.connect();

    try {
      const projectRes = await client.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Active') AS active,
          COUNT(*) FILTER (WHERE status = 'Completed') AS completed
        FROM Projects
      `);

      const taskRes = await client.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE ts.status_name = 'pending') AS pending,
          COUNT(*) FILTER (WHERE ts.status_name = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE ts.status_name = 'done') AS done,
          COUNT(*) FILTER (
            WHERE t.due_date < CURRENT_DATE
              AND ts.status_name NOT IN ('done', 'archived')
          ) AS overdue
        FROM Tasks t
        LEFT JOIN TaskStatuses ts ON t.task_id = ts.task_id AND ts.is_current = TRUE
      `);

      const userRes = await client.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Active') AS active
        FROM Users
      `);

      const deptRes = await client.query(`
        SELECT
          d.department_name,
          COUNT(t.task_id) AS task_count
        FROM Departments d
        LEFT JOIN ProjectParts pp ON d.department_id = pp.department_id
        LEFT JOIN Tasks t ON pp.part_id = t.part_id
        GROUP BY d.department_id, d.department_name
        ORDER BY task_count DESC
      `);

      const weeklyRes = await client.query(`
        WITH days AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'
          )::date AS day
        ),
        daily_stats AS (
          SELECT
            DATE(th.created_at) AS day,
            COUNT(*) FILTER (WHERE th.status_after_update = 'done') AS completed,
            COUNT(*) FILTER (WHERE ts.status_name = 'pending') AS pending
          FROM Taskhistories th
          LEFT JOIN TaskStatuses ts ON th.task_id = ts.task_id AND ts.is_current
          WHERE th.created_at >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY DATE(th.created_at)
        )
        SELECT
          to_char(d.day, 'Dy') AS day,
          COALESCE(ds.completed, 0) AS completed,
          COALESCE(ds.pending, 0) AS pending
        FROM days d
        LEFT JOIN daily_stats ds ON d.day = ds.day
        ORDER BY d.day
      `);

      const projStatusRes = await client.query(`
        SELECT status, COUNT(*) AS count
        FROM Projects
        GROUP BY status
      `);

      const topRes = await client.query(`
        SELECT
          u.first_name || ' ' || u.last_name AS full_name,
          COUNT(th.task_id) AS completed_tasks
        FROM Taskhistories th
        JOIN Users u ON th.user_id = u.user_id
        WHERE th.status_after_update = 'done'
          AND th.created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY u.user_id, u.first_name, u.last_name
        ORDER BY completed_tasks DESC
        LIMIT 5
      `);

      return {
        totalProjects: Number(projectRes.rows[0].total),
        activeProjects: Number(projectRes.rows[0].active),
        completedProjects: Number(projectRes.rows[0].completed),

        totalTasks: Number(taskRes.rows[0].total),
        pendingTasks: Number(taskRes.rows[0].pending),
        inProgressTasks: Number(taskRes.rows[0].in_progress),
        doneTasks: Number(taskRes.rows[0].done),
        overdueTasks: Number(taskRes.rows[0].overdue),

        totalUsers: Number(userRes.rows[0].total),
        activeUsers: Number(userRes.rows[0].active),

        departmentTaskLoad: deptRes.rows,
        weeklyTaskProgress: weeklyRes.rows,
        projectStatus: projStatusRes.rows,
        topPerformers: topRes.rows,
      };
    } finally {
      client.release();
    }
  }
}