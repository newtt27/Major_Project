// src/routes/report.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/permission.middleware'; // Dùng hasPermission
import { validate } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';
import * as reportController from '../controllers/report.controller';

const router = Router();

// Middleware xác thực (BẮT BUỘC cho tất cả route bên dưới)
router.use(authenticate);

// --- ENDPOINT CHO CẢ 3 VAI TRÒ ---
// GET /api/reports - Lấy danh sách báo cáo (phân quyền nghiệp vụ trong Service, kiểm tra quyền chung ở Route)
router.get('/', hasPermission('view:reports'), reportController.getReports);

// THÊM MỚI: Staff lấy danh sách manager của department
router.get('/my-managers', hasPermission('view:managers'), reportController.getMyManagers);

// THÊM MỚI: Manager lấy danh sách admin
router.get('/admins', hasPermission('view:admins'), reportController.getAdmins);

// --- ENDPOINT CHO NHÂN VIÊN (STAFF) ---
// 1. Employee: Gửi báo cáo công việc
router.post(
    '/employee',
    hasPermission('create:employee:report'), // Kiểm tra quyền tạo báo cáo nhân viên
    [
        body('title').isString().notEmpty().withMessage('Tiêu đề không được để trống.'),
        body('summary').isString().notEmpty().withMessage('Tóm tắt công việc không được để trống.'),
        body('issues_and_proposals').isString().notEmpty().withMessage('Khó khăn và đề xuất không được để trống.'),
        body('next_plan_or_resources').isString().notEmpty().withMessage('Kế hoạch tiếp theo không được để trống.'),
        body('submitted_to_id').isInt({ gt: 0 }).toInt().withMessage('ID manager không hợp lệ.'), // THÊM: submitted_to_id bắt buộc
        validate,
    ],
    reportController.createEmployeeReport
);

// --- ENDPOINT CHO TRƯỞNG PHÒNG (MANAGER) ---
// 1. Manager: Gửi báo cáo tổng hợp
router.post(
    '/manager',
    hasPermission('create:manager:report'), // Kiểm tra quyền tạo báo cáo tổng hợp
    [
        body('title').isString().notEmpty().withMessage('Tiêu đề không được để trống.'),
        body('summary').isString().notEmpty().withMessage('Tóm tắt tổng hợp không được để trống.'),
        body('issues_and_proposals').isString().notEmpty().withMessage('Vấn đề và kiến nghị không được để trống.'),
        body('next_plan_or_resources').isString().notEmpty().withMessage('Đề xuất nguồn lực không được để trống.'),
        body('submitted_to_id').isInt({ gt: 0 }).toInt().withMessage('ID admin không hợp lệ.'), // BẮT BUỘC: submitted_to_id
        validate,
    ],
    reportController.createManagerReport
);

// 2. Manager: Đánh giá báo cáo của Nhân viên
router.post(
    '/:reportId/review/manager',
    hasPermission('review:employee:report'), // Kiểm tra quyền đánh giá báo cáo nhân viên
    [
        param('reportId').isInt({ gt: 0 }).toInt().withMessage('ID báo cáo không hợp lệ.'),
        body('review_result').isIn(['approved', 'rejected', 'needs_revision']).withMessage('Kết quả đánh giá không hợp lệ.'),
        body('comment').isString().notEmpty().withMessage('Nhận xét không được để trống.'),
        body('performance_rating').isIn(['Đạt', 'Không đạt', 'Muộn tiến độ']).withMessage('Xếp loại hiệu suất không hợp lệ.'),
        validate,
    ],
    reportController.reviewEmployeeReport
);

// --- ENDPOINT CHO ADMIN ---
// Admin: Đánh giá báo cáo tổng hợp của Manager
router.post(
    '/:reportId/review/admin',
    hasPermission('review:manager:report'), // Kiểm tra quyền đánh giá báo cáo manager
    [
        param('reportId').isInt({ gt: 0 }).toInt().withMessage('ID báo cáo không hợp lệ.'),
        body('admin_review_result').isIn(['approved', 'rejected']).withMessage('Kết quả đánh giá của Admin không hợp lệ.'),
        body('admin_comment').isString().notEmpty().withMessage('Nhận xét của Admin không được để trống.'),
        body('strategic_value_rating').isIn(['Cao', 'Trung bình', 'Thấp']).withMessage('Giá trị chiến lược không hợp lệ.'),
        validate,
    ],
    reportController.reviewManagerReport
);

export default router;