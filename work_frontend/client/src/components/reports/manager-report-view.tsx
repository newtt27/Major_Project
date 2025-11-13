"use client"

import { useState, useMemo } from "react"
import { useGetReportsQuery } from "@/state/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import ManagerReportForm from "./forms/manager-report-form"
import ManagerReviewForm from "./forms/manager-review-form"
import { useAppSelector } from "@/app/redux"

export default function ManagerReportView() {
  const userId = useAppSelector((state) => state.auth.userId)
  const { data: reportsData, isLoading, refetch } = useGetReportsQuery()
  const [showForm, setShowForm] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'my-reports' | 'review'>('my-reports')

  const reports = reportsData || []

  // Filter manager reports created by this manager
  const managerReports = useMemo(() => 
    reports.filter(r => r.report_type === 'Manager_Summary' && r.generated_by === userId), 
    [reports, userId]
  )

  // Filter employee reports pending review
  const employeeReportsForReview = useMemo(() => 
    reports.filter(r => r.report_type === 'Employee_Report' && r.report_status === 'Pending_Review'), 
    [reports]
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800"
      case "Rejected": return "bg-red-100 text-red-800"
      case "Pending_Review": return "bg-yellow-100 text-yellow-800"
      case "Draft": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Báo Cáo Của Tôi','Chờ Duyệt (Nhân Viên)','Đã Duyệt','Bị Từ Chối'].map((title, idx) => {
          let count = 0
          switch(idx) {
            case 0: count = managerReports.length; break;
            case 1: count = employeeReportsForReview.length; break;
            case 2: count = managerReports.filter(r => r.report_status==='Approved').length; break;
            case 3: count = managerReports.filter(r => r.report_status==='Rejected').length; break;
          }
          return (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${idx===1?'text-yellow-600':idx===2?'text-green-600':idx===3?'text-red-600':''}`}>{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v)=>setSelectedTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-reports">Báo Cáo Của Tôi</TabsTrigger>
          <TabsTrigger value="review">Duyệt Báo Cáo ({employeeReportsForReview.length})</TabsTrigger>
        </TabsList>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Báo Cáo Tổng Hợp</h2>
            <Button onClick={()=>setShowForm(!showForm)} className="gap-2">
              <Plus size={18}/> {showForm ? "Hủy" : "Tạo Báo Cáo Tổng Hợp"}
            </Button>
          </div>

          {showForm && <ManagerReportForm onSuccess={()=>{setShowForm(false); refetch()}} />}

          {isLoading ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Đang tải...</p></Card>
          ) : managerReports.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Chưa có báo cáo tổng hợp nào</p></Card>
          ) : (
            managerReports.map(report => <ReportCard key={report.report_id} report={report} getStatusColor={getStatusColor} />)
          )}
        </TabsContent>

        {/* Review Reports Tab */}
        <TabsContent value="review" className="space-y-4">
          <h2 className="text-2xl font-bold">Duyệt Báo Cáo Nhân Viên</h2>

          {isLoading ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Đang tải...</p></Card>
          ) : employeeReportsForReview.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Không có báo cáo chờ duyệt</p></Card>
          ) : (
            employeeReportsForReview.map(report => 
              <ReviewReportCard key={report.report_id} report={report} getStatusColor={getStatusColor} onReviewSuccess={()=>refetch()} />
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReportCard({ report, getStatusColor }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>{report.report_type==='Employee_Report' ? 'Báo Cáo Công Việc' : 'Báo Cáo Tổng Hợp'}</CardDescription>
          </div>
          <Badge className={getStatusColor(report.report_status)}>{report.report_status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm"><span className="font-semibold">Ngày tạo:</span> {new Date(report.generated_at).toLocaleDateString("vi-VN")}</p>
        <p className="text-sm"><span className="font-semibold">Cập nhật lần cuối:</span> {new Date(report.updated_at).toLocaleDateString("vi-VN")}</p>
      </CardContent>
    </Card>
  )
}

function ReviewReportCard({ report, getStatusColor, onReviewSuccess }: any) {
  const [showReviewForm, setShowReviewForm] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>Báo Cáo Công Việc - ID: {report.report_id}</CardDescription>
          </div>
          <Badge className={getStatusColor(report.report_status)}>{report.report_status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm"><span className="font-semibold">Ngày tạo:</span> {new Date(report.generated_at).toLocaleDateString("vi-VN")}</p>
        <Button variant="outline" onClick={()=>setShowReviewForm(!showReviewForm)} className="w-full">
          {showReviewForm ? "Hủy" : "Duyệt Báo Cáo"}
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
