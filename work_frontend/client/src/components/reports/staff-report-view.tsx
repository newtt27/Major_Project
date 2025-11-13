"use client"

import { useState, useMemo } from "react"
import { useGetReportsQuery, useCreateEmployeeReportMutation } from "@/state/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import StaffReportForm from "./forms/staff-report-form"
import { useAppSelector } from "@/app/redux"

export default function StaffReportView() {
  const userId = useAppSelector((state) => state.auth.userId)
  const [showForm, setShowForm] = useState(false)
  const { data: reportsData, isLoading, refetch } = useGetReportsQuery()
  const [createReport] = useCreateEmployeeReportMutation()

  const reports = reportsData || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Pending_Review":
        return "bg-yellow-100 text-yellow-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Memoized filtered lists
  const pendingReports = useMemo(
    () => reports.filter((r) => r.report_status === "Pending_Review"),
    [reports]
  )
  const approvedReports = useMemo(
    () => reports.filter((r) => r.report_status === "Approved"),
    [reports]
  )
  const rejectedReports = useMemo(
    () => reports.filter((r) => r.report_status === "Rejected"),
    [reports]
  )

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng Báo Cáo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ Duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đã Duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedReports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bị Từ Chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedReports.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Danh Sách Báo Cáo</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={18} />
          {showForm ? "Hủy" : "Tạo Báo Cáo Mới"}
        </Button>
      </div>

      {/* Create Report Form */}
      {showForm && (
        <StaffReportForm
          onSuccess={() => {
            setShowForm(false)
            refetch()
          }}
        />
      )}

      {/* Reports List Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tất Cả</TabsTrigger>
          <TabsTrigger value="pending">Chờ Duyệt</TabsTrigger>
          <TabsTrigger value="approved">Đã Duyệt</TabsTrigger>
          <TabsTrigger value="rejected">Bị Từ Chối</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <LoadingCard />
          ) : reports.length === 0 ? (
            <EmptyCard message="Chưa có báo cáo nào. Hãy tạo báo cáo đầu tiên!" />
          ) : (
            reports.map((report) => (
              <ReportCard key={report.report_id} report={report} getStatusColor={getStatusColor} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <EmptyCard message="Không có báo cáo chờ duyệt" />
          ) : (
            pendingReports.map((report) => (
              <ReportCard key={report.report_id} report={report} getStatusColor={getStatusColor} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReports.length === 0 ? (
            <EmptyCard message="Không có báo cáo đã duyệt" />
          ) : (
            approvedReports.map((report) => (
              <ReportCard key={report.report_id} report={report} getStatusColor={getStatusColor} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedReports.length === 0 ? (
            <EmptyCard message="Không có báo cáo bị từ chối" />
          ) : (
            rejectedReports.map((report) => (
              <ReportCard key={report.report_id} report={report} getStatusColor={getStatusColor} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReportCard({ report, getStatusColor }: any) {
  const kpi = report.report_items?.[0]?.kpi_results || "Chưa có dữ liệu"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>
              {report.report_type === "Employee_Report" ? "Báo Cáo Cá Nhân" : "Báo Cáo Tổng Hợp"}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(report.report_status)}>
            {report.report_status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-1">
          <p><span className="font-semibold">Ngày tạo:</span> {new Date(report.generated_at).toLocaleDateString("vi-VN")}</p>
          <p><span className="font-semibold">Cập nhật:</span> {new Date(report.updated_at).toLocaleDateString("vi-VN")}</p>
        </div>
        {kpi && (
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-900">Thống kê tuần:</p>
            <p className="text-blue-800">{kpi}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingCard() {
  return (
    <Card className="p-8 text-center">
      <p className="text-muted-foreground">Đang tải...</p>
    </Card>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </Card>
  )
}
