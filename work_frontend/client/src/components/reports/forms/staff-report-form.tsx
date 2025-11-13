// src/components/staff-report-form.tsx (Đã có sẵn, chỉ xác nhận không lỗi map)
"use client"

import type React from "react"
import { useState } from "react"
import { useCreateEmployeeReportMutation, useGetMyManagersQuery } from "@/state/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface StaffReportFormProps {
  onSuccess?: () => void
}

export default function StaffReportForm({ onSuccess }: StaffReportFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    issues_and_proposals: "",
    next_plan_or_resources: "",
    submitted_to_id: 0,
  })

  const { data: managers = [], isLoading: isLoadingManagers } = useGetMyManagersQuery()
  const [createReport, { isLoading }] = useCreateEmployeeReportMutation()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tiêu đề", variant: "destructive" })
      return
    }

    if (formData.submitted_to_id <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng chọn Trưởng phòng nhận báo cáo", variant: "destructive" })
      return
    }

    try {
      await createReport({
        title: formData.title,
        summary: formData.summary,
        issues_and_proposals: formData.issues_and_proposals,
        next_plan_or_resources: formData.next_plan_or_resources,
        submitted_to_id: formData.submitted_to_id,
      }).unwrap()

      toast({ title: "Thành công", description: "Báo cáo đã được gửi!" })

      setFormData({ title: "", summary: "", issues_and_proposals: "", next_plan_or_resources: "", submitted_to_id: 0 })
      onSuccess?.()
    } catch (error: any) {
      toast({ title: "Lỗi", description: error?.data?.message || "Gửi thất bại", variant: "destructive" })
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Tạo Báo Cáo Công Việc</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tiêu Đề <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="VD: Báo cáo tuần 45 - 04/11/2025"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Gửi Đến Trưởng Phòng <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.submitted_to_id > 0 ? formData.submitted_to_id.toString() : ""}
            onValueChange={(value) => setFormData({ ...formData, submitted_to_id: parseInt(value) })}
            disabled={isLoadingManagers}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn trưởng phòng..." />
            </SelectTrigger>
            <SelectContent>
              {managers.map((manager: any) => (
                <SelectItem key={manager.user_id} value={manager.user_id.toString()}>
                  {manager.name} ({manager.department_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tóm Tắt Công Việc</label>
          <Textarea
            placeholder="Những việc đã làm trong tuần..."
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Khó Khăn & Đề Xuất</label>
          <Textarea
            placeholder="Khó khăn gặp phải, cần hỗ trợ gì..."
            value={formData.issues_and_proposals}
            onChange={(e) => setFormData({ ...formData, issues_and_proposals: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kế Hoạch Tuần Tới</label>
          <Textarea
            placeholder="Công việc sắp tới, cần nguồn lực gì..."
            value={formData.next_plan_or_resources}
            onChange={(e) => setFormData({ ...formData, next_plan_or_resources: e.target.value })}
            rows={4}
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          <p className="font-medium">Hệ thống tự động thống kê:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Số task trong tuần</li>
            <li>Số task hoàn thành</li>
            <li>Số task quá hạn</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading || isLoadingManagers}>
            {isLoading ? "Đang gửi..." : "Gửi Báo Cáo"}
          </Button>
        </div>
      </form>
    </Card>
  )
}