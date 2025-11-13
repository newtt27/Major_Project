// src/controllers/report.controller.ts
import { Response, NextFunction } from 'express';
import reportService from '../services/report.services';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// 1. Employee: Gửi báo cáo công việc
export const createEmployeeReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const report = await reportService.createEmployeeReport(userId, req.body);
        res.status(201).json({
            message: 'Báo cáo công việc đã được gửi thành công.',
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// 2. Manager: Gửi báo cáo tổng hợp phòng ban
export const createManagerReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const report = await reportService.createManagerReport(userId, req.body);
        res.status(201).json({
            message: 'Báo cáo tổng hợp đã được gửi thành công.',
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

// 3. Manager: Đánh giá báo cáo Nhân viên
export const reviewEmployeeReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const managerId = req.user!.userId;
        const reportId = parseInt(req.params.reportId, 10);
        if (isNaN(reportId)) {
            throw new Error('ID báo cáo không hợp lệ.');
        }

        const result = await reportService.reviewEmployeeReport(managerId, reportId, req.body);
        res.status(200).json({
            message: 'Đánh giá báo cáo nhân viên thành công.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// 4. Admin: Đánh giá báo cáo Manager
export const reviewManagerReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.userId;
        const reportId = parseInt(req.params.reportId, 10);
        if (isNaN(reportId)) {
            throw new Error('ID báo cáo không hợp lệ.');
        }

        const result = await reportService.reviewManagerReport(adminId, reportId, req.body);
        res.status(200).json({
            message: 'Đánh giá báo cáo tổng hợp của Manager thành công.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// 5. Lấy danh sách báo cáo
export const getReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const role = req.user!.roles[0] as 'staff' | 'manager' | 'admin';

        const reports = await reportService.getReports(userId, role, req.query);

        res.status(200).json({
            message: 'Lấy danh sách báo cáo thành công.',
            data: reports,
        });
    } catch (error) {
        next(error);
    }
};

// 6. Staff: Lấy danh sách manager của phòng ban
export const getMyManagers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const managers = await reportService.getMyManagers(userId);
        res.status(200).json({
            message: 'Lấy danh sách manager thành công.',
            data: managers,
        });
    } catch (error) {
        next(error);
    }
};

// 7. Manager: Lấy danh sách admin (SỬA LỖI: BỎ req KHÔNG DÙNG)
export const getAdmins = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const admins = await reportService.getAdmins();
        res.status(200).json({
            message: 'Lấy danh sách admin thành công.',
            data: admins,
        });
    } catch (error) {
        next(error);
    }
};