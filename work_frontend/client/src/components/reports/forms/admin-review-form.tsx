"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useReviewManagerReportMutation } from "@/state/api" // Đảm bảo import đúng

interface AdminReviewFormProps {
  report: any
  onSuccess?: () => void
  onCancel?: () => void
}

interface ReportItem {
  item_id: number
  task_id: number | null
  work_done_summary: string
  kpi_results: string
  difficulty_proposal: string
  next_plan: string
  manager_evaluation: string
  manager_feedback: string
}


export default function AdminReviewForm({ report, onSuccess, onCancel }: AdminReviewFormProps) {
  const [reviewManagerReport, { isLoading }] = useReviewManagerReportMutation()
  const { toast } = useToast()

  const mapStrategicValue = (value: string) => {
    switch (value) {
      case "Cao": return "high"
      case "Trung bình": return "medium"
      case "Thấp": return "low"
      default: return "medium"
    }
  }

  const mapToVietnamese = (value: string) => {
    switch (value) {
      case "high": return "Cao"
      case "medium": return "Trung bình"
      case "low": return "Thấp"
      default: return "Trung bình"
    }
  }

  const [formData, setFormData] = useState({
    decision: "approved",
    strategic_value: "medium",
    feedback: "",
  })

  useEffect(() => {
    if (report?.report_data?.admin_review) {
      const adminReview = report.report_data.admin_review
      setFormData({
        decision: adminReview.admin_review_result === "rejected" ? "rejected" : "approved",
        strategic_value: mapStrategicValue(adminReview.strategic_value_rating),
        feedback: adminReview.admin_comment || "",
      })
    } else {
      setFormData({
        decision: "approved",
        strategic_value: "medium",
        feedback: "",
      })
    }
  }, [report])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.feedback.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập phản hồi", variant: "destructive" })
      return
    }

    try {
      await reviewManagerReport({
        reportId: report.report_id,
        admin_review_result: formData.decision, // "approved" | "rejected"
        admin_comment: formData.feedback,
        strategic_value_rating: mapToVietnamese(formData.strategic_value), // "Cao" | "Trung bình" | "Thấp"
      }).unwrap()

      toast({
        title: "Thành công",
        description: `Báo cáo đã được ${formData.decision === "approved" ? "phê duyệt" : "từ chối"} thành công!`
      })
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.data?.message || "Cập nhật báo cáo thất bại",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="bg-card border border-border shadow-lg w-full">
      <CardContent className="space-y-6 p-6">
        <h3 className="text-2xl font-bold text-slate-900">Duyệt Báo Cáo Tổng Hợp Manager</h3>

        {/* Thông tin báo cáo */}
        <div className="bg-muted p-4 rounded-lg space-y-3 shadow-inner">
          <p className="text-sm"><span className="font-semibold">Tiêu đề:</span> {report.title}</p>
          <p className="text-sm"><span className="font-semibold">Tác giả:</span> {report.reporter_name}</p>
          <p className="text-sm"><span className="font-semibold">Phòng:</span> {report.department_name}</p>
          <p className="text-sm"><span className="font-semibold">Loại:</span> {report.report_type}</p>

          {report.report_data && (
            <div className="bg-white p-3 rounded-md border border-border space-y-2 mt-3">
              {report.report_data.issues?.length > 0 && <p className="text-sm"><span className="font-semibold">Vấn đề:</span> {report.report_data.issues.join(", ")}</p>}
              {report.report_data.top_staff && <p className="text-sm"><span className="font-semibold">Nhân viên xuất sắc:</span> {report.report_data.top_staff}</p>}
              {report.report_data.overdue_tasks !== undefined && <p className="text-sm"><span className="font-semibold">Số task quá hạn:</span> {report.report_data.overdue_tasks}</p>}
              {report.report_data.completion_rate !== undefined && <p className="text-sm"><span className="font-semibold">Tỉ lệ hoàn thành:</span> {(report.report_data.completion_rate * 100).toFixed(2)}%</p>}
            </div>
          )}

          {report.report_items?.length > 0 && (
            <div className="bg-white p-3 rounded-md border border-border space-y-3 mt-3">
              {report.report_items.map((item: ReportItem, idx: number) => (
                <div key={idx} className="space-y-1 border-b border-border pb-2 last:border-b-0">
                  <p className="text-sm"><span className="font-semibold">Công việc đã làm:</span> {item.work_done_summary}</p>
                  <p className="text-sm"><span className="font-semibold">KPI / Kết quả:</span> {item.kpi_results}</p>
                  <p className="text-sm"><span className="font-semibold">Khó khăn / Đề xuất:</span> {item.difficulty_proposal}</p>
                  <p className="text-sm"><span className="font-semibold">Kế hoạch tiếp theo / Nguồn lực:</span> {item.next_plan}</p>
                  <p className="text-sm"><span className="font-semibold">Đánh giá của quản lý:</span> {item.manager_evaluation}</p>
                  <p className="text-sm"><span className="font-semibold">Phản hồi của quản lý:</span> {item.manager_feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* THÊM: Thông báo nếu đang sửa đánh giá cũ */}
        {report.report_status !== 'Pending_Review' && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-800">
              Trạng thái hiện tại: {report.report_status === 'Approved' ? 'Đã phê duyệt' : 'Đã từ chối'}
              {report.report_data?.admin_review?.admin_review_date && (
                <> vào {new Date(report.report_data.admin_review.admin_review_date).toLocaleString('vi-VN')}</>
              )}
            </p>
            <p className="text-xs text-amber-700 mt-1">Bạn đang sửa lại đánh giá này.</p>
          </div>
        )}

        {/* Form duyệt báo cáo */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Strategic Value */}
          <div>
            <Label htmlFor="strategic-value" className="font-semibold mb-2 block text-base">
              Giá Trị Chiến Lược <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.strategic_value} onValueChange={(value) => setFormData({ ...formData, strategic_value: value })}>
              <SelectTrigger id="strategic-value">
                <SelectValue placeholder="Chọn giá trị chiến lược" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Thấp</SelectItem>
                <SelectItem value="medium">Trung Bình</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decision */}
          <div>
            <Label className="font-semibold mb-2 block text-base">Quyết Định</Label>
            <RadioGroup value={formData.decision} onValueChange={(value) => setFormData({ ...formData, decision: value })} className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted transition ${formData.decision === 'approved' ? 'bg-green-50' : ''}`}>
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="cursor-pointer flex-1 text-green-700 font-medium">Phê Duyệt</Label>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted transition ${formData.decision === 'rejected' ? 'bg-red-50' : ''}`}>
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="cursor-pointer flex-1 text-red-700 font-medium">Từ Chối</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback" className="font-semibold mb-2 block text-base">
              Phản Hồi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="feedback"
              placeholder="Nhập phản hồi và nhận xét chung cho báo cáo..."
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Buttons (THÊM: Thay đổi nút nếu đang sửa) */}
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`${
                formData.decision === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isLoading ? "Đang xử lý..." : report.report_status !== 'Pending_Review' ? "Cập nhật đánh giá" : (formData.decision === "approved" ? "Phê Duyệt" : "Từ Chối")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}