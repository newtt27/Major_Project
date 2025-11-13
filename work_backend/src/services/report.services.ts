// src/services/report.services.ts
import { query, pool } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import {
    EmployeeReportCreateDTO,
    ManagerReportCreateDTO,
    ManagerReviewDTO,
    AdminReviewDTO,
} from '../dto/report.dto';
import notificationService from './notification.services';

interface ReportDB {
    report_id: number;
    generated_by: number;
    report_type: 'Employee_Report' | 'Manager_Summary';
    title: string;
    report_status: 'Draft' | 'Pending_Review' | 'Approved' | 'Rejected';
    generated_at: Date;
    updated_at: Date;
    report_data: any | null;
    submitted_to_id?: number;
    reporter_name?: string;
    department_name?: string;
    manager_reviewer_name?: string;
    admin_reviewer_name?: string;
    summary?: string;
    issues_and_proposals?: string;
    next_plan_or_resources?: string;
    tasks?: Array<{
        task_id: number;
        progress_percentage: number;
        actual_output: string;
        status_at_report: string;
    }>;
}

class ReportService {

   async createEmployeeReport(userId: number, data: EmployeeReportCreateDTO): Promise<ReportDB> {
       const client = await pool.connect();
       let reportId: number;

       try {
           await client.query('BEGIN');

           // 1. Kiểm tra manager hợp lệ
           const managerCheck = await client.query(
               `SELECT d.manager_id
                FROM Users u
                JOIN Departments d ON u.department_id = d.department_id
                WHERE u.user_id = $1 AND d.manager_id = $2 AND d.status = 'Active'`,
               [userId, data.submitted_to_id]
           );

           if (managerCheck.rowCount === 0) {
               throw new AppError('Manager không hợp lệ hoặc không quản lý phòng ban của bạn.', 400);
           }

           // 2. Xác định tuần báo cáo: Thứ 2 → CN
           const now = new Date();
           const weekStart = new Date(now);
           weekStart.setHours(0, 0, 0, 0);
           weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

           const weekEnd = new Date(weekStart);
           weekEnd.setDate(weekEnd.getDate() + 6);
           weekEnd.setHours(23, 59, 59, 999);

           // 3. Tính KPI theo logic mới (siêu chính xác)
           const tasksRes = await client.query(`
               SELECT
                   COUNT(*) AS total_tasks,
                   COUNT(*) FILTER (WHERE tp.percentage_complete = 100 AND tp.updated_at >= $2 AND tp.updated_at <= $3) AS completed_this_week,
                   COUNT(*) FILTER (WHERE tp.percentage_complete = 100) AS completed_total,
                   COUNT(*) FILTER (WHERE t.due_date < NOW() AND (tp.percentage_complete < 100 OR tp.percentage_complete IS NULL)) AS overdue_tasks,
                   COUNT(*) FILTER (WHERE tp.percentage_complete > 0 AND tp.percentage_complete < 100) AS in_progress,
                   COUNT(*) FILTER (WHERE tp.percentage_complete = 0 OR tp.percentage_complete IS NULL) AS not_started
               FROM TaskAssignments ta
               JOIN Tasks t ON ta.task_id = t.task_id
               LEFT JOIN Taskprogresses tp ON t.task_id = tp.task_id
               WHERE ta.user_id = $1
                 AND (
                   t.start_date BETWEEN $2 AND $3 OR
                   t.due_date BETWEEN $2 AND $3 OR
                   (tp.percentage_complete < 100 OR tp.percentage_complete IS NULL) OR
                   t.created_at BETWEEN $2 AND $3
                 )
           `, [userId, weekStart, weekEnd]);

           const stats = tasksRes.rows[0];

         const kpiResults = `
         Tuần báo cáo: ${weekStart.toLocaleDateString('vi-VN')} → ${weekEnd.toLocaleDateString('vi-VN')}
         Tổng task cần theo dõi: ${stats.total_tasks}
         Đã hoàn thành: ${stats.completed_total} (trong đó ${stats.completed_this_week} hoàn thành tuần này)
         Quá hạn: ${stats.overdue_tasks}
         Đang thực hiện: ${stats.in_progress}
         Chưa bắt đầu: ${stats.not_started}
         `.trim();


           // 4. Tạo báo cáo
           const reportRes = await client.query(`
               INSERT INTO Reports (
                   generated_by, report_type, title, report_status, submitted_to_id, generated_at
               ) VALUES ($1, 'Employee_Report', $2, 'Pending_Review', $3, NOW())
               RETURNING report_id
           `, [userId, data.title, data.submitted_to_id]);

           reportId = reportRes.rows[0].report_id;

           // 5. Lưu nội dung báo cáo + KPI
           await client.query(`
               INSERT INTO Report_Items (
                   report_id, work_done_summary, kpi_results, difficulty_proposal, next_plan
               ) VALUES ($1, $2, $3, $4, $5)
           `, [
               reportId,
               data.summary || '',
               kpiResults,
               data.issues_and_proposals || '',
               data.next_plan_or_resources || ''
           ]);

           // 6. Gắn file (nếu có)
           if (data.attachment_ids && data.attachment_ids.length > 0) {
               await client.query(`
                   UPDATE Attachments SET entity_type = 'report', entity_id = $1
                   WHERE attachment_id = ANY($2::int[])
               `, [reportId, data.attachment_ids]);
           }

           // COMMIT TRƯỚC KHI GỬI NOTIFICATION → BẮT BUỘC ĐỂ TRÁNH LỖI FK
           await client.query('COMMIT');

       } catch (error) {
           await client.query('ROLLBACK');
           throw error;
       } finally {
           client.release();
       }

       // 7. GỬI THÔNG BÁO CHO MANAGER (SAU COMMIT → AN TOÀN 100%)
       try {
           const reporterRes = await pool.query(
               `SELECT first_name || ' ' || last_name AS name FROM Users WHERE user_id = $1`,
               [userId]
           );
           const reporterName = reporterRes.rows[0]?.name || 'Nhân viên';

           await notificationService.createNotification({
               report_id: reportId,                    // ← Bây giờ đã tồn tại trong DB
               user_id: data.submitted_to_id,
               message: `${reporterName} đã gửi báo cáo tuần này: "${data.title}"`,
               notification_type: "New",
               priority: "High"
           });
       } catch (notifError) {
           console.error('Gửi thông báo thất bại (không ảnh hưởng báo cáo):', notifError);
           // Không throw lỗi → báo cáo vẫn tạo thành công
       }

       // 8. Trả về báo cáo đầy đủ
       const result = await this.getReportById(reportId);
       return result;
   }

   async createManagerReport(userId: number, data: ManagerReportCreateDTO): Promise<ReportDB> {
       const client = await pool.connect();
       let reportId: number;

       try {
           await client.query('BEGIN');

           // 1. Kiểm tra user có phải manager của ít nhất 1 phòng ban không
           const managerCheck = await client.query(
               `SELECT d.department_id, d.department_name
                FROM Departments d
                WHERE d.manager_id = $1 AND d.status = 'Active'`,
               [userId]
           );

           if (managerCheck.rowCount === 0) {
               throw new AppError('Bạn không phải trưởng phòng của bất kỳ phòng ban nào.', 403);
           }

           const { department_id, department_name } = managerCheck.rows[0];

           // 2. Kiểm tra submitted_to_id có phải admin không
           const adminCheck = await client.query(
               `SELECT 1 FROM Account_Roles ar
                JOIN Roles r ON ar.role_id = r.role_id
                JOIN Accounts a ON ar.account_id = a.account_id
                WHERE a.user_id = $1 AND r.role_name = 'admin'`,
               [data.submitted_to_id]
           );

           if (adminCheck.rowCount === 0) {
               throw new AppError('Người nhận phải là Admin.', 400);
           }

           // 3. Xác định tuần báo cáo: Thứ 2 → Chủ Nhật
           const now = new Date();
           const weekStart = new Date(now);
           weekStart.setHours(0, 0, 0, 0);
           weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

           const weekEnd = new Date(weekStart);
           weekEnd.setDate(weekEnd.getDate() + 6);
           weekEnd.setHours(23, 59, 59, 999);

          const statsRes = await client.query(`
              WITH user_tasks AS (
                  SELECT
                      u.user_id,
                      u.first_name || ' ' || u.last_name AS full_name,
                      COUNT(*) AS total_tasks,
                      COUNT(*) FILTER (WHERE tp.percentage_complete = 100) AS completed_tasks,
                      COUNT(*) FILTER (
                          WHERE t.due_date < NOW()
                            AND (tp.percentage_complete < 100 OR tp.percentage_complete IS NULL)
                      ) AS overdue_tasks
                  FROM TaskAssignments ta
                  JOIN Tasks t ON ta.task_id = t.task_id
                  JOIN Users u ON ta.user_id = u.user_id
                  LEFT JOIN Taskprogresses tp ON t.task_id = tp.task_id
                  WHERE u.department_id = $1
                    AND (
                      t.start_date BETWEEN $2 AND $3 OR
                      t.due_date BETWEEN $2 AND $3 OR
                      (tp.percentage_complete < 100 OR tp.percentage_complete IS NULL) OR
                      t.created_at BETWEEN $2 AND $3
                    )
                  GROUP BY u.user_id, u.first_name, u.last_name
              )
              SELECT
                  COUNT(*) AS total_members,
                  COALESCE(SUM(total_tasks), 0) AS total_tasks,
                  COALESCE(SUM(completed_tasks), 0) AS completed_tasks,
                  COALESCE(SUM(overdue_tasks), 0) AS overdue_tasks,

                  -- ĐÃ FIX: dùng ::numeric để ROUND hoạt động ngon
                  ROUND(
                      COALESCE(
                          (SUM(completed_tasks)::numeric / NULLIF(SUM(total_tasks), 0) * 100),
                          0
                      )::numeric, 1
                  ) AS completion_rate_percent,

                  COALESCE((ARRAY_AGG(full_name ORDER BY completed_tasks DESC NULLS LAST))[1], 'Chưa có') AS top_performer,
                  COALESCE((ARRAY_AGG(completed_tasks ORDER BY completed_tasks DESC NULLS LAST))[1], 0) AS top_performer_count,
                  COALESCE((ARRAY_AGG(full_name ORDER BY overdue_tasks DESC NULLS LAST))[1], 'Chưa có') AS most_overdue_name,
                  COALESCE((ARRAY_AGG(overdue_tasks ORDER BY overdue_tasks DESC NULLS LAST))[1], 0) AS most_overdue_count
              FROM user_tasks
          `, [department_id, weekStart, weekEnd]);

           const stats = statsRes.rows[0];

          const kpiSummary = `
          BÁO CÁO TUẦN - ${department_name.toUpperCase()}
          Tuần: ${weekStart.toLocaleDateString('vi-VN')} → ${weekEnd.toLocaleDateString('vi-VN')}

          KPI TOÀN PHÒNG BAN
          Số nhân viên có task: ${stats.total_members} người
          Tổng task cần theo dõi: ${stats.total_tasks}
          Đã hoàn thành: ${stats.completed_tasks}
          Tỷ lệ hoàn thành: ${stats.completion_rate_percent}%
          Task quá hạn: ${stats.overdue_tasks}

          NHÂN VIÊN XUẤT SẮC TUẦN NÀY
          ${stats.top_performer} (${stats.top_performer_count} task hoàn thành)

          NHÂN VIÊN CẦN CẢI THIỆN
          ${stats.most_overdue_name} (${stats.most_overdue_count} task quá hạn)
          `.trim();

          const finalTitle = data.title || `Báo cáo tuần ${weekStart.toLocaleDateString('vi-VN')} - ${department_name}`;

          const reportRes = await client.query(`
              INSERT INTO Reports (
                  generated_by, report_type, title, report_status, submitted_to_id, generated_at
              ) VALUES ($1, 'Manager_Summary', $2, 'Pending_Review', $3, NOW())
              RETURNING report_id
          `, [userId, finalTitle, data.submitted_to_id]);

          reportId = reportRes.rows[0].report_id;

          await client.query(`
              INSERT INTO Report_Items (
                  report_id, work_done_summary, kpi_results, difficulty_proposal, next_plan
              ) VALUES ($1, $2, $3, $4, $5)
          `, [
              reportId,
              data.summary || 'Không có tóm tắt thêm.',
              kpiSummary,
              data.issues_and_proposals || 'Không có vấn đề đề xuất.',
              data.next_plan_or_resources || 'Không có kế hoạch cụ thể.'
          ]);

           await client.query('COMMIT');

           // 8. GỬI THÔNG BÁO CHO ADMIN
           const managerRes = await client.query(
               `SELECT first_name || ' ' || last_name AS name FROM Users WHERE user_id = $1`,
               [userId]
           );
           const managerName = managerRes.rows[0]?.name || 'Trưởng phòng';

           await notificationService.createNotification({
               report_id: reportId,
               user_id: data.submitted_to_id,
               message: `Trưởng phòng ${managerName} (${department_name}) đã gửi báo cáo tuần với tỷ lệ hoàn thành ${stats.completion_rate_percent}%`,
               notification_type: "New",
               priority: "High"
           });

           const result = await this.getReportById(reportId);
           return result;

       } catch (error) {
           await client.query('ROLLBACK');
           throw error;
       } finally {
           client.release();
       }
   }

    async reviewEmployeeReport(managerId: number, reportId: number, data: ManagerReviewDTO): Promise<ReportDB> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const checkRes = await client.query(
                `SELECT * FROM Reports WHERE report_id = $1 AND report_type = 'Employee_Report'`,
                [reportId]
            );

            if (checkRes.rows.length === 0) throw new AppError('Báo cáo không tồn tại.', 404);
            if (checkRes.rows[0].submitted_to_id !== managerId) {
                throw new AppError('Bạn không có quyền đánh giá báo cáo này.', 403);
            }

            let status: string;
            switch (data.review_result) {
                case 'approved': status = 'Approved'; break;
                case 'rejected': status = 'Rejected'; break;
                case 'needs_revision': status = 'Pending_Review'; break;
                default: throw new AppError('Kết quả đánh giá không hợp lệ.', 400);
            }

            await query(`UPDATE Reports SET report_status = $1 WHERE report_id = $2`, [status, reportId]);

            const reviewData = {
                manager_id: managerId,
                result: data.review_result,
                comment: data.comment,
                rating: data.performance_rating,
                date: new Date().toISOString()
            };

            await query(`
                UPDATE Report_Items
                SET manager_evaluation = $1, manager_feedback = $2
                WHERE report_id = $3
            `, [data.performance_rating, data.comment, reportId]);

            await query(`
                UPDATE Reports
                SET report_data = jsonb_set(COALESCE(report_data, '{}'::jsonb), '{manager_review}', $1::jsonb)
                WHERE report_id = $2
            `, [JSON.stringify(reviewData), reportId]);

            const message = data.review_result === 'approved'
                ? `Báo cáo "${checkRes.rows[0].title}" đã được duyệt.`
                : data.review_result === 'rejected'
                ? `Báo cáo "${checkRes.rows[0].title}" bị từ chối.`
                : `Báo cáo "${checkRes.rows[0].title}" cần chỉnh sửa.`;

            await notificationService.createNotification({
                report_id: reportId,
                user_id: checkRes.rows[0].generated_by,
                message,
                notification_type: "Update",
                priority: data.review_result === 'approved' ? "Medium" : "High"
            });

            await client.query('COMMIT');
            return await this.getReportById(reportId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async reviewManagerReport(adminId: number, reportId: number, data: AdminReviewDTO): Promise<ReportDB> {
        const checkRes = await query(
            `SELECT * FROM Reports WHERE report_id = $1 AND report_type = 'Manager_Summary'`,
            [reportId]
        );

        if (checkRes.rows.length === 0) throw new AppError('Báo cáo không tồn tại.', 404);
        if (checkRes.rows[0].submitted_to_id !== adminId) {
            throw new AppError('Bạn không có quyền đánh giá báo cáo này.', 403);
        }

        const status = data.admin_review_result === 'approved' ? 'Approved' : 'Rejected';
        await query(`UPDATE Reports SET report_status = $1 WHERE report_id = $2`, [status, reportId]);

        const adminReview = {
            admin_id: adminId,
            result: data.admin_review_result,
            comment: data.admin_comment,
            rating: data.strategic_value_rating,
            date: new Date().toISOString()
        };

        await query(`
            UPDATE Reports
            SET report_data = jsonb_set(COALESCE(report_data, '{}'::jsonb), '{admin_review}', $1::jsonb)
            WHERE report_id = $2
        `, [JSON.stringify(adminReview), reportId]);

        const message = data.admin_review_result === 'approved'
            ? `Báo cáo tổng hợp "${checkRes.rows[0].title}" đã được phê duyệt.`
            : `Báo cáo tổng hợp "${checkRes.rows[0].title}" bị từ chối.`;

        await notificationService.createNotification({
            report_id: reportId,
            user_id: checkRes.rows[0].generated_by,
            message,
            notification_type: "Update",
            priority: data.admin_review_result === 'approved' ? "Medium" : "High"
        });

        return await this.getReportById(reportId);
    }

   async getReports(
           userId: number,
           role: 'staff' | 'manager' | 'admin',
           filters: any = {}
       ): Promise<ReportDB[]> {
           // ... (phần SQL truy vấn giữ nguyên)
           let sql = `
               SELECT
                   r.*,
                   u.first_name || ' ' || u.last_name AS reporter_name,
                   d.department_name,
                   COALESCE(json_agg(
                       json_build_object(
                           'item_id', ri.item_id,
                           'work_done_summary', ri.work_done_summary,
                           'kpi_results', ri.kpi_results,
                           'difficulty_proposal', ri.difficulty_proposal,
                           'next_plan', ri.next_plan,
                           'manager_evaluation', ri.manager_evaluation,
                           'manager_feedback', ri.manager_feedback
                       )
                   ) FILTER (WHERE ri.item_id IS NOT NULL), '[]') AS report_items,
                   COALESCE(json_agg(DISTINCT jsonb_build_object(
                       'task_id', rt.task_id,
                       'progress_percentage', rt.progress_percentage,
                       'actual_output', rt.actual_output,
                       'status_at_report', rt.status_at_report
                   )) FILTER (WHERE rt.task_id IS NOT NULL), '[]') AS report_tasks
               FROM Reports r
               JOIN Users u ON r.generated_by = u.user_id
               LEFT JOIN Departments d ON u.department_id = d.department_id
               LEFT JOIN Report_Items ri ON ri.report_id = r.report_id
               LEFT JOIN Report_Tasks rt ON rt.report_id = r.report_id
           `;

           const params: any[] = [];
           const where: string[] = [];
           let idx = 1;

           if (role === 'staff') {
               where.push(`r.generated_by = $${idx++}`); params.push(userId);
               where.push(`r.report_type = 'Employee_Report'`);
           } else if (role === 'manager') {
               where.push(`(
                   (r.submitted_to_id = $${idx++} AND r.report_type = 'Employee_Report')
                   OR
                   (r.generated_by = $${idx++} AND r.report_type = 'Manager_Summary')
               )`);
               params.push(userId, userId);
           } else if (role === 'admin') {
               where.push(`r.submitted_to_id = $${idx++}`); params.push(userId);
               where.push(`r.report_type = 'Manager_Summary'`);
           }

           if (filters.status) { where.push(`r.report_status = $${idx++}`); params.push(filters.status); }
           if (filters.report_type) { where.push(`r.report_type = $${idx++}`); params.push(filters.report_type); }

           if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;
           sql += ` GROUP BY r.report_id, u.first_name, u.last_name, d.department_name ORDER BY r.generated_at DESC`;

           const res = await query(sql, params);

           const reports = res.rows;
           for (const report of reports) {
               if (report.report_type === 'Employee_Report') {
                   report.weekly_tasks = await this.getWeeklyTasksForReport(report.generated_by, report.generated_at);
               } else {
                   report.weekly_tasks = [];
               }

               if (report.report_type === 'Manager_Summary' && report.report_items && report.report_items.length > 0) {

                    const item = report.report_items[0];

                    report.report_items = [{
                        item_id: item.item_id,
                        work_done_summary: item.work_done_summary,
                        kpi_results: item.kpi_results,
                        difficulty_proposal: item.difficulty_proposal,
                        next_plan: item.next_plan,
                        manager_evaluation: item.manager_evaluation,
                        manager_feedback: item.manager_feedback,
                    }];
               }
           }

           return reports;
       }

    async getMyManagers(userId: number): Promise<any[]> {
        const res = await query(`
            SELECT
                d.manager_id AS user_id,
                u.first_name || ' ' || u.last_name AS name,
                d.department_name
            FROM Users us
            JOIN Departments d ON us.department_id = d.department_id
            LEFT JOIN Users u ON d.manager_id = u.user_id
            WHERE us.user_id = $1 AND d.status = 'Active' AND d.manager_id IS NOT NULL
        `, [userId]);

        if (res.rows.length === 0) {
            throw new AppError('Không tìm thấy trưởng phòng của bạn.', 404);
        }

        return res.rows;
    }

    async getAdmins(): Promise<any[]> {
        const res = await query(`
            SELECT
                u.user_id,
                u.first_name || ' ' || u.last_name AS name,
                a.email
            FROM Users u
            JOIN Accounts a ON u.user_id = a.user_id
            JOIN Account_Roles ar ON a.account_id = ar.account_id
            JOIN Roles r ON ar.role_id = r.role_id
            WHERE r.role_name = 'admin' AND u.status = 'Active'
            ORDER BY u.last_name, u.first_name
        `);

        return res.rows;
    }

    private async getWeeklyTasksForReport(userId: number, generatedAt: string): Promise<any[]> {
            const reportDate = new Date(generatedAt);
            const weekStart = new Date(reportDate);
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

            const tasksRes = await query(`
                SELECT
                    t.task_id,
                    t.title,
                    tp.percentage_complete AS progress_percentage,
                    t.due_date,
                    CASE
                        WHEN tp.percentage_complete = 100 THEN 'Hoàn thành'
                        WHEN t.due_date < NOW() AND tp.percentage_complete < 100 THEN 'Trễ hạn'
                        WHEN tp.percentage_complete > 0 THEN 'Đang làm'
                        ELSE 'Vướng mắc'
                    END AS status_at_report
                FROM TaskAssignments ta
                JOIN Tasks t ON ta.task_id = t.task_id
                LEFT JOIN Taskprogresses tp ON t.task_id = tp.task_id
                WHERE ta.user_id = $1 AND t.due_date >= $2
            `, [userId, weekStart]);

            return tasksRes.rows;
        }
   private async getReportById(reportId: number): Promise<ReportDB> {
           const res = await query(`
               SELECT
                   r.*,
                   u.first_name || ' ' || u.last_name AS reporter_name,
                   d.department_name,
                   COALESCE(json_agg(
                       json_build_object(
                           'item_id', ri.item_id,
                           'work_done_summary', ri.work_done_summary,
                           'kpi_results', ri.kpi_results,
                           'difficulty_proposal', ri.difficulty_proposal,
                           'next_plan', ri.next_plan,
                           'manager_evaluation', ri.manager_evaluation,
                           'manager_feedback', ri.manager_feedback
                       )
                   ) FILTER (WHERE ri.item_id IS NOT NULL), '[]') AS report_items
               FROM Reports r
               JOIN Users u ON r.generated_by = u.user_id
               LEFT JOIN Departments d ON u.department_id = d.department_id
               LEFT JOIN Report_Items ri ON ri.report_id = r.report_id
               WHERE r.report_id = $1
               GROUP BY r.report_id, u.first_name, u.last_name, d.department_name
           `, [reportId]);

           if (res.rows.length === 0) throw new AppError('Báo cáo không tồn tại.', 404);

           const report = res.rows[0];

           // Xử lý dữ liệu hiển thị cho Manager_Summary
           if (report.report_type === 'Manager_Summary' && report.report_items && report.report_items.length > 0) {
                const item = report.report_items[0];
                report.report_items = [{
                    item_id: item.item_id,
                    work_done_summary: item.work_done_summary,
                    kpi_results: item.kpi_results,
                    difficulty_proposal: item.difficulty_proposal,
                    next_plan: item.next_plan,
                    manager_evaluation: item.manager_evaluation,
                    manager_feedback: item.manager_feedback,
                }];
           }

           if (report.report_type === 'Employee_Report') {
               report.weekly_tasks = await this.getWeeklyTasksForReport(report.generated_by, report.generated_at);
           } else {
               report.weekly_tasks = [];
           }

           return report;
       }
}

export default new ReportService();