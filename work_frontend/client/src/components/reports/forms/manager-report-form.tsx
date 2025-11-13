// src/components/manager-report-form.tsx (Sửa để fix lỗi map không function)
"use client"

import type React from "react"
import { useState } from "react"
import { useCreateManagerReportMutation, useGetAdminsQuery } from "@/state/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ManagerReportFormProps {
  onSuccess?: () => void
}

export default function ManagerReportForm({ onSuccess }: ManagerReportFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    issues_and_proposals: "",
    next_plan_or_resources: "",
    submitted_to_id: 0,
  })

  const { data: admins = [], isLoading: isLoadingAdmins } = useGetAdminsQuery()
  const [createReport, { isLoading }] = useCreateManagerReportMutation()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề báo cáo",
        variant: "destructive",
      })
      return
    }

    if (formData.submitted_to_id <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn Admin nhận báo cáo",
        variant: "destructive",
      })
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

      toast({
        title: "Thành công",
        description: "Báo cáo tổng hợp đã được gửi thành công!",
      })

      setFormData({
        title: "",
        summary: "",
        issues_and_proposals: "",
        next_plan_or_resources: "",
        submitted_to_id: 0,
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.data?.message || "Gửi báo cáo thất bại",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-lg font-semibold">Tạo Báo Cáo Tổng Hợp (Gửi cho Admin)</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tiêu Đề <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="VD: Báo cáo tuần 45 - Phòng Phát triển"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Gửi Đến Admin <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.submitted_to_id > 0 ? formData.submitted_to_id.toString() : ""}
            onValueChange={(value) => setFormData({ ...formData, submitted_to_id: parseInt(value) })}
            disabled={isLoadingAdmins}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn admin..." />
            </SelectTrigger>
            <SelectContent>
              {admins.map((admin: any) => (
                <SelectItem key={admin.user_id} value={admin.user_id.toString()}>
                  {admin.name} ({admin.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tóm Tắt Tổng Hợp</label>
          <Textarea
            placeholder="Tình hình chung: hoàn thành, tiến độ, kết quả..."
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Vấn Đề & Kiến Nghị</label>
          <Textarea
            placeholder="Khó khăn gặp phải, đề xuất giải pháp..."
            value={formData.issues_and_proposals}
            onChange={(e) => setFormData({ ...formData, issues_and_proposals: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kế Hoạch & Nguồn Lực</label>
          <Textarea
            placeholder="Kế hoạch tuần tới, yêu cầu bổ sung nhân sự/máy móc..."
            value={formData.next_plan_or_resources}
            onChange={(e) => setFormData({ ...formData, next_plan_or_resources: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium">Hệ thống tự động tính:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Tỷ lệ hoàn thành task trong tuần</li>
            <li>Số task quá hạn</li>
            <li>Nhân viên xuất sắc (hoàn thành nhiều task nhất)</li>
          </ul>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading || isLoadingAdmins} className="min-w-40">
            {isLoading ? "Đang gửi..." : "Gửi Báo Cáo cho Admin"}
          </Button>
        </div>
      </form>
    </Card>
  )
}