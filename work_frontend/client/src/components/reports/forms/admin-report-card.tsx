"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AdminReviewForm from "./admin-review-form"

interface AdminReportCardProps {
  report: any
  getStatusColor: (status: string) => string
  onReviewSuccess: () => void
}

export default function AdminReportCard({ report, getStatusColor, onReviewSuccess }: AdminReportCardProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)

  return (
    <Card className="flex flex-col border border-border shadow-lg w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>Báo Cáo ID: {report.report_id}</CardDescription>
          </div>
          <Badge className={getStatusColor(report.report_status)}>{report.report_status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex flex-col">
        {/* Thông tin cơ bản */}
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Ngày tạo:</span> {new Date(report.generated_at).toLocaleString()}</p>
          <p><span className="font-semibold">Cập nhật lần cuối:</span> {new Date(report.updated_at).toLocaleString()}</p>
        </div>

        {/* Nút mở form */}
        <Button variant="outline" onClick={() => setShowReviewForm(!showReviewForm)} className="w-full">
          {showReviewForm ? "Ẩn Báo Cáo" : "Duyệt Báo Cáo"}
        </Button>

        {/* Form review */}
        {showReviewForm && (
          <div className="mt-4">
            <AdminReviewForm
              report={report}
              onSuccess={() => {
                setShowReviewForm(false)
                onReviewSuccess()
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export { AdminReportCard }
