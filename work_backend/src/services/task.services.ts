// src/services/task.services.ts
import { pool } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import type {
  CreateTaskDTO,
  UpdateTaskDTO,
  UpdateTaskProgressDTO,
  UploadAttachmentDTO,
} from "../dto/task.dto"

export class TaskService {
  async createTask(data: CreateTaskDTO, createdBy: number) {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      if (data.is_direct_assignment && data.part_id) {
        throw new AppError("Direct assignment tasks cannot have part_id", 400)
      }
      if (!data.is_direct_assignment && !data.part_id) {
        throw new AppError("Non-direct tasks must have part_id", 400)
      }
      if (data.start_date && data.due_date && data.start_date > data.due_date) {
        throw new AppError("start_date must be <= due_date", 400)
      }

      const taskResult = await client.query(
        `INSERT INTO Tasks
         (title, description, priority, created_by, assigned_by, part_id, is_direct_assignment,
          required_file_count, start_date, due_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          data.title,
          data.description,
          data.priority || "Medium",
          createdBy,
          createdBy,
          data.part_id,
          data.is_direct_assignment || false,
          data.required_file_count || 0,
          data.start_date,
          data.due_date,
        ]
      )
      const taskId = taskResult.rows[0].task_id

      for (const [i, userId] of data.assigned_users.entries()) {
        const isMain = data.main_assignee_id
          ? userId === data.main_assignee_id
          : i === 0
        await client.query(
          "INSERT INTO TaskAssignments (task_id, user_id, is_main_assignee) VALUES ($1,$2,$3)",
          [taskId, userId, isMain]
        )
      }

      await client.query(
        `INSERT INTO TaskStatuses (task_id, status_name, is_current)
         VALUES ($1, 'pending', TRUE)`,
        [taskId]
      )

      await client.query("COMMIT")
      return taskResult.rows[0]
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async getMyTasks(userId: number, filters: any = {}) {
  const params: any[] = [userId];
  let where = `ta.user_id = $1`;

  if (filters.department_id) { where += ` AND u.department_id = $${params.push(filters.department_id)}`; }
  if (filters.priority) { where += ` AND t.priority = $${params.push(filters.priority)}`; }
  if (filters.status) { where += ` AND ts.status_name = $${params.push(filters.status)}`; }
  if (filters.start_date) { where += ` AND t.start_date >= $${params.push(filters.start_date)}`; }
  if (filters.end_date) { where += ` AND t.due_date <= $${params.push(filters.end_date)}`; }
  if (filters.search) { where += ` AND t.title ILIKE $${params.push(`%${filters.search}%`)}`; }

  const query = `
    SELECT DISTINCT 
      t.*, 
      ts.status_name, 
      ta.is_main_assignee,
      pp.part_name,
      pr.project_name
    FROM Tasks t
    JOIN TaskAssignments ta ON t.task_id = ta.task_id
    JOIN TaskStatuses ts ON t.task_id = ts.task_id AND ts.is_current = TRUE
    LEFT JOIN Users u ON ta.user_id = u.user_id
    LEFT JOIN ProjectParts pp ON t.part_id = pp.part_id
    LEFT JOIN Projects pr ON pp.project_id = pr.project_id
    WHERE ${where}
    ORDER BY t.created_at DESC
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

  async updateTaskProgress(taskId: number, userId: number, data: UpdateTaskProgressDTO) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // --- Lấy task và khoá dòng để update ---
    const taskRes = await client.query("SELECT * FROM Tasks WHERE task_id = $1 FOR UPDATE", [taskId])
    if (!taskRes.rows.length) throw new AppError("Task not found", 404)
    const task = taskRes.rows[0]

    // --- Kiểm tra user được giao task này ---
    const assignRes = await client.query(
      "SELECT 1 FROM TaskAssignments WHERE task_id = $1 AND user_id = $2",
      [taskId, userId]
    )
    if (!assignRes.rows.length) throw new AppError("Not assigned to this task", 403)

    // --- Lấy progress hiện tại ---
    let progressRes = await client.query(
      "SELECT * FROM taskprogresses WHERE task_id = $1 FOR UPDATE",
      [taskId]
    );

    if (!progressRes.rows.length) {
      // 🔹 Nếu chưa có progress, tạo mới
      await client.query(
        `INSERT INTO taskprogresses (task_id, user_id, percentage_complete, is_tick_complete, updated_at)
        VALUES ($1, $2, 0, FALSE, CURRENT_TIMESTAMP)`,
        [taskId, userId]
      );


      progressRes = await client.query(
        "SELECT * FROM taskprogresses WHERE task_id = $1 FOR UPDATE",
        [taskId]
      );
    }

    let newPct = progressRes.rows[0].percentage_complete

    // --- Cập nhật theo tick ---
    if (data.is_tick_complete !== undefined) {
      newPct = data.is_tick_complete ? 100 : 0
    }

    // --- Cập nhật theo percentage_complete trực tiếp ---
    if (data.percentage_complete !== undefined) {
      newPct = data.percentage_complete

      // Nếu muốn hoàn thành 100%, kiểm tra file bắt buộc
      if (newPct === 100 && task.required_file_count > 0) {
        const fileCountRes = await client.query(
          "SELECT COUNT(*) FROM Attachments WHERE task_id = $1",
          [taskId]
        )
        const filesUploaded = Number(fileCountRes.rows[0].count)
        if (filesUploaded < task.required_file_count) {
          throw new AppError(`Need ${task.required_file_count} files`, 400)
        }
      }
    }

    // --- ✅ Update bảng TaskProgresses ---
    const result = await client.query(
      `UPDATE TaskProgresses
       SET percentage_complete = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE task_id = $2
       RETURNING *`,
      [newPct, taskId]
    )

    // --- Ghi lịch sử milestone ---
    if (data.milestone_description) {
      await client.query(
        `INSERT INTO TaskHistories (task_id, user_id, action, milestone_description)
         VALUES ($1, $2, 'progress_update', $3)`,
        [taskId, userId, data.milestone_description]
      )
    }

    // --- Nếu hoàn thành 100%, cập nhật trạng thái Done ---
    if (newPct === 100) {
      // Tắt trạng thái hiện tại (nếu có)
      await client.query(
        `UPDATE TaskStatuses
        SET is_current = FALSE
        WHERE task_id = $1 AND is_current = TRUE`,
        [taskId]
      )

      // Kiểm tra lại nếu đã có status "done"
      const doneStatus = await client.query(
        `SELECT 1 FROM TaskStatuses WHERE task_id = $1 AND status_name = 'done'`,
        [taskId]
      )

      // Nếu chưa có -> insert mới
      if (!doneStatus.rows.length) {
        await client.query(
          `INSERT INTO TaskStatuses (task_id, status_name, is_current)
          VALUES ($1, 'done', TRUE)`,
          [taskId]
        )
      } else {
        // Nếu có rồi -> chỉ cập nhật is_current = TRUE
        await client.query(
          `UPDATE TaskStatuses
          SET is_current = TRUE
          WHERE task_id = $1 AND status_name = 'done'`,
          [taskId]
        )
      }
    }


    await client.query("COMMIT")
    return result.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

  async uploadAttachments(data: UploadAttachmentDTO, userId: number, files: Express.Multer.File[] = []) {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const taskRes = await client.query("SELECT 1 FROM Tasks WHERE task_id = $1", [data.task_id])
      if (!taskRes.rows.length) throw new AppError("Task not found", 404)

      const assignRes = await client.query(
        "SELECT 1 FROM TaskAssignments WHERE task_id = $1 AND user_id = $2",
        [data.task_id, userId]
      )
      if (!assignRes.rows.length) throw new AppError("Not assigned", 403)

      const results = []

      for (const file of files) {
        const msgRes = await client.query(
          `INSERT INTO Messages (chatroom_id, sender_id, message_text)
           VALUES (NULL, $1, $2) RETURNING message_id`,
          [userId, data.message || "Task file"]
        )
        const messageId = msgRes.rows[0].message_id

        const attachRes = await client.query(
          `INSERT INTO Attachments (message_id, chatroom_id, task_id, file_name, file_path, mime_type, file_size, uploaded_by)
           VALUES ($1, NULL, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [messageId, data.task_id, file.originalname, file.path, file.mimetype, file.size, userId]
        )
        results.push(attachRes.rows[0])
      }

      await client.query("COMMIT")
      return results
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async getTaskById(taskId: number, userId: number) {
    const result = await pool.query(
      `SELECT t.*, ts.status_name, ta.is_main_assignee
       FROM Tasks t
       JOIN TaskAssignments ta ON t.task_id = ta.task_id
       JOIN TaskStatuses ts ON t.task_id = ts.task_id AND ts.is_current = TRUE
       WHERE t.task_id = $1 AND ta.user_id = $2`,
      [taskId, userId]
    )
    if (!result.rows.length) throw new AppError("Task not found or not assigned", 404)
    return result.rows[0]
  }

  async updateTask(taskId: number, data: UpdateTaskDTO, userId: number) {
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (data.title) { fields.push(`title = $${idx++}`); values.push(data.title) }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description) }
    if (data.priority) { fields.push(`priority = $${idx++}`); values.push(data.priority) }
    if (data.start_date) { fields.push(`start_date = $${idx++}`); values.push(data.start_date) }
    if (data.due_date) { fields.push(`due_date = $${idx++}`); values.push(data.due_date) }

    if (fields.length === 0) throw new AppError("No fields", 400)

    values.push(taskId)
    const result = await pool.query(
      `UPDATE Tasks SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE task_id = $${idx} AND EXISTS (SELECT 1 FROM TaskAssignments WHERE task_id = $${idx} AND user_id = $1)
       RETURNING *`,
      [userId, ...values]
    )
    if (!result.rows.length) throw new AppError("Task not found or not authorized", 404)
    return result.rows[0]
  }

  async deleteTask(taskId: number) {
    const result = await pool.query("DELETE FROM Tasks WHERE task_id = $1 RETURNING task_id", [taskId])
    if (!result.rows.length) throw new AppError("Task not found", 404)
    return { message: "Task deleted" }
  }

  async changeMainAssignee(taskId: number, userId: number) {
    const check = await pool.query("SELECT 1 FROM TaskAssignments WHERE task_id = $1 AND user_id = $2", [taskId, userId])
    if (!check.rows.length) throw new AppError("User not assigned", 403)

    await pool.query("UPDATE TaskAssignments SET is_main_assignee = FALSE WHERE task_id = $1", [taskId])
    const result = await pool.query(
      "UPDATE TaskAssignments SET is_main_assignee = TRUE WHERE task_id = $1 AND user_id = $2 RETURNING *",
      [taskId, userId]
    )
    return result.rows[0]
  }

  async updateTaskAssignments(taskId: number, assigned_users: number[]) {
    await pool.query("DELETE FROM TaskAssignments WHERE task_id = $1", [taskId])
    const results = []
    for (const [i, userId] of assigned_users.entries()) {
      const isMain = i === 0
      const r = await pool.query(
        "INSERT INTO TaskAssignments (task_id, user_id, is_main_assignee) VALUES ($1,$2,$3) RETURNING *",
        [taskId, userId, isMain]
      )
      results.push(r.rows[0])
    }
    return results
  }

  async getTaskHistory(taskId: number) {
    const result = await pool.query(
      `SELECT th.*, u.first_name || ' ' || u.last_name as user_name
       FROM Taskhistories th
       JOIN Users u ON th.user_id = u.user_id
       WHERE th.task_id = $1
       ORDER BY th.created_at DESC`,
      [taskId]
    )
    return result.rows
  }
  async getTasksByPartId(partId: number) {
  const result = await pool.query(
    `
    SELECT 
      t.task_id,
      t.title,
      t.description,
      t.priority,
      t.priority_order,
      t.created_by,
      t.assigned_by,
      t.part_id,
      t.start_date,
      t.due_date,
      t.created_at,
      t.updated_at,
      t.required_file_count,
      ts.status_name,
      tp.percentage_complete
    FROM Tasks t
    JOIN TaskStatuses ts 
      ON t.task_id = ts.task_id AND ts.is_current = TRUE
    LEFT JOIN (
      SELECT task_id, MAX(percentage_complete) AS percentage_complete
      FROM Taskprogresses
      GROUP BY task_id
    ) tp ON t.task_id = tp.task_id
    WHERE t.part_id = $1
    ORDER BY t.created_at DESC
    `,
    [partId]
  );

  return result.rows;
}
async getTaskFullDetailById(taskId: number) {
  const client = await pool.connect()
  try {
    // Lấy task chính kèm status_name và assigned_by info
    const taskRes = await client.query(
      `SELECT t.*, ts.status_name,
              u.user_id AS assigned_by_id,
              u.first_name AS assigned_by_first_name,
              u.last_name AS assigned_by_last_name
       FROM Tasks t
       JOIN TaskStatuses ts ON t.task_id = ts.task_id AND ts.is_current = TRUE
       LEFT JOIN Users u ON t.assigned_by = u.user_id
       WHERE t.task_id = $1`,
      [taskId]
    )

    if (!taskRes.rows.length) throw new AppError("Task not found", 404)

    // Lấy history, assignments, progresses và số lượng attachment đồng thời
    const [historyRes, assignmentsRes, progressesRes, attachmentRes] = await Promise.all([
      client.query(
        `SELECT h.*, u.user_id, u.first_name, u.last_name
         FROM Taskhistories h
         LEFT JOIN Users u ON h.user_id = u.user_id
         WHERE h.task_id = $1
         ORDER BY h.created_at DESC`,
        [taskId]
      ),
      client.query(
        `SELECT a.*, u.user_id, u.first_name, u.last_name
         FROM TaskAssignments a
         LEFT JOIN Users u ON a.user_id = u.user_id
         WHERE a.task_id = $1`,
        [taskId]
      ),
      client.query(
        `SELECT * FROM Taskprogresses WHERE task_id = $1 ORDER BY updated_at DESC`,
        [taskId]
      ),
      client.query(
        `SELECT COUNT(*) AS count FROM Attachments WHERE task_id = $1`,
        [taskId]
      )
    ])

    return {
      ...taskRes.rows[0],
      task_history: historyRes.rows,
      assignments: assignmentsRes.rows,
      progresses: progressesRes.rows,
      attachment_count: Number(attachmentRes.rows[0].count)
    }
  } finally {
    client.release()
  }
}

}