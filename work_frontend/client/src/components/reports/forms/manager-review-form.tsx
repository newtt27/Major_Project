// src/components/manager-review-form.tsx
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
import { useReviewEmployeeReportMutation } from "@/state/api"

interface ManagerReviewFormProps {
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
  manager_evaluation?: string
  manager_feedback?: string
}

export default function ManagerReviewForm({ report, onSuccess, onCancel }: ManagerReviewFormProps) {
  const [reviewEmployeeReport, { isLoading }] = useReviewEmployeeReportMutation()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    decision: "approved",
    performance_rating: "Đạt",
    feedback: "",
  })

  useEffect(() => {
    if (report?.report_items?.[0]) {
      const item = report.report_items[0]
      setFormData({
        decision: item.manager_evaluation === "Không đạt" ? "rejected" : "approved",
        performance_rating: item.manager_evaluation || "Đạt",
        feedback: item.manager_feedback || "",
      })
    } else {
      setFormData({
        decision: "approved",
        performance_rating: "Đạt",
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
      await reviewEmployeeReport({
        reportId: report.report_id,
        review_result: formData.decision,
        comment: formData.feedback,
        performance_rating: formData.performance_rating,
      }).unwrap()

      toast({
        title: "Thành công",
        description: `Báo cáo đã được ${formData.decision === "approved" ? "phê duyệt" : "từ chối"}`
      })
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.data?.message || "Cập nhật thất bại",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="bg-card border border-border shadow-lg w-full">
      <CardContent className="space-y-6 p-6">
        <h3 className="text-2xl font-bold text-slate-900">Duyệt Báo Cáo Nhân Viên</h3>

        {/* Thông tin báo cáo */}
        <div className="bg-muted p-4 rounded-lg space-y-3 shadow-inner">
          <p className="text-sm"><span className="font-semibold">Tiêu đề:</span> {report.title}</p>
          <p className="text-sm"><span className="font-semibold">Tác giả:</span> {report.reporter_name}</p>
          <p className="text-sm"><span className="font-semibold">Phòng:</span> {report.department_name}</p>
          <p className="text-sm"><span className="font-semibold">Ngày tạo:</span> {new Date(report.generated_at).toLocaleDateString("vi-VN")}</p>

          {report.report_items?.length > 0 && (
            <div className="bg-white p-3 rounded-md border border-border space-y-3 mt-3">
              {report.report_items.map((item: ReportItem, idx: number) => (
                <div key={idx} className="space-y-1 border-b border-border pb-2 last:border-b-0">
                  <p className="text-sm"><span className="font-semibold">Công việc đã làm:</span> {item.work_done_summary}</p>
                  <p className="text-sm"><span className="font-semibold">KPI / Kết quả:</span> {item.kpi_results}</p>
                  <p className="text-sm"><span className="font-semibold">Khó khăn / Đề xuất:</span> {item.difficulty_proposal}</p>
                  <p className="text-sm"><span className="font-semibold">Kế hoạch tiếp theo:</span> {item.next_plan}</p>
                  {item.manager_evaluation && (
                    <p className="text-sm"><span className="font-semibold">Đánh giá cũ:</span> {item.manager_evaluation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

         {report.weekly_tasks?.length > 0 && (  
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Chi Tiết Task (Tự Động Thống Kê)</h4>
              <div className="bg-white rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Task ID</th>
                      <th className="text-left p-2 font-medium">Tiêu đề</th>  {/* MỚI: Thêm title */}
                      <th className="text-left p-2 font-medium">Tiến độ</th>
                      <th className="text-left p-2 font-medium">Hạn</th>  {/* MỚI: due_date */}
                      <th className="text-left p-2 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.weekly_tasks.map((task: any, idx: number) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2">{task.task_id}</td>
                        <td className="p-2 max-w-xs truncate" title={task.title}>{task.title}</td>  {/* MỚI */}
                        <td className="p-2">
                          <span className={`font-medium ${
                            task.progress_percentage >= 100 ? 'text-green-600' :
                            task.progress_percentage >= 70 ? 'text-blue-600' :
                            task.progress_percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {task.progress_percentage}%
                          </span>
                        </td>
                        <td className="p-2">{new Date(task.due_date).toLocaleDateString('vi-VN')}</td>  {/* MỚI */}
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status_at_report === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                            task.status_at_report === 'Đang làm' ? 'bg-blue-100 text-blue-800' :
                            task.status_at_report === 'Trễ hạn' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status_at_report}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Trạng thái sửa */}
        {report.report_status !== 'Pending_Review' && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800">
              Trạng thái hiện tại: {report.report_status === 'Approved' ? 'Đã phê duyệt' : 'Đã từ chối'}
            </p>
            <p className="text-xs text-amber-700 mt-1">Bạn đang sửa lại đánh giá.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Performance Rating */}
          <div>
            <Label htmlFor="rating" className="font-semibold mb-2 block text-base">
              Xếp Loại Hiệu Suất <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.performance_rating} onValueChange={(v) => setFormData({ ...formData, performance_rating: v })}>
              <SelectTrigger id="rating">
                <SelectValue placeholder="Chọn xếp loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Đạt">Đạt</SelectItem>
                <SelectItem value="Không đạt">Không đạt</SelectItem>
                <SelectItem value="Muộn tiến độ">Muộn tiến độ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decision */}
          <div>
            <Label className="font-semibold mb-2 block text-base">Quyết Định</Label>
            <RadioGroup value={formData.decision} onValueChange={(v) => setFormData({ ...formData, decision: v })}>
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
              placeholder="Nhập nhận xét chi tiết..."
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`${formData.decision === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {isLoading ? "Đang xử lý..." : report.report_status !== 'Pending_Review' ? "Cập nhật" : (formData.decision === "approved" ? "Phê Duyệt" : "Từ Chối")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}