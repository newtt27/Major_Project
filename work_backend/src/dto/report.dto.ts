// src/dto/report.dto.ts

export interface ReportTaskDTO {
    task_id: number;
    progress_percentage: number;
    actual_output: string;
    status_at_report: 'Hoàn thành' | 'Đang làm' | 'Trễ hạn' | 'Vướng mắc';
}

// 1. DTO khi Nhân viên gửi báo cáo (Employee Report) - LOẠI BỎ tasks, THÊM submitted_to_id
export interface EmployeeReportCreateDTO {
    title: string;
    summary: string;
    issues_and_proposals: string;
    next_plan_or_resources: string;
    attachment_ids?: number[];
    submitted_to_id: number;
}

// 2. DTO khi Manager gửi báo cáo tổng hợp (Manager Summary Report)
export interface ManagerReportCreateDTO {
    title: string;
    summary: string;
    issues_and_proposals: string;
    next_plan_or_resources: string;
    attachment_ids?: number[];
    submitted_to_id: number;
}

// 3. DTO khi Manager đánh giá báo cáo Nhân viên
export interface ManagerReviewDTO {
    review_result: 'approved' | 'rejected' | 'needs_revision';
    comment: string;
    performance_rating: 'Đạt' | 'Không đạt' | 'Muộn tiến độ';
}

// 4. DTO khi Admin đánh giá báo cáo Manager
export interface AdminReviewDTO {
    admin_review_result: 'approved' | 'rejected';
    admin_comment: string;
    strategic_value_rating: 'Cao' | 'Trung bình' | 'Thấp';
}