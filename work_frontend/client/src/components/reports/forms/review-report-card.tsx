// src/components/review-report-card.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ManagerReviewForm from "./manager-review-form"

interface ReviewReportCardProps {
  report: any
  getStatusColor: (status: string) => string
  onReviewSuccess: () => void
}

export default function ReviewReportCard({ report, getStatusColor, onReviewSuccess }: ReviewReportCardProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{report.title}</CardTitle>
            <CardDescription>
              Báo Cáo Công Việc • ID: {report.report_id}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(report.report_status)}>
            {report.report_status === 'Pending_Review' ? 'Chờ duyệt' : report.report_status === 'Approved' ? 'Đã duyệt' : 'Bị từ chối'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-1">
          <p><span className="font-semibold">Tác giả:</span> {report.reporter_name}</p>
          <p><span className="font-semibold">Phòng:</span> {report.department_name}</p>
          <p><span className="font-semibold">Ngày tạo:</span> {new Date(report.generated_at).toLocaleDateString("vi-VN")}</p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => setShowReviewForm(!showReviewForm)} 
          className="w-full"
        >
          {showReviewForm ? "Ẩn Form" : "Duyệt Báo Cáo"}
        </Button>

        {showReviewForm && (
          <ManagerReviewForm
            report={report}
            onSuccess={() => {
              setShowReviewForm(false)
              onReviewSuccess()
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}