"use client"

import { useState, useMemo } from "react"
import { useGetReportsQuery } from "@/state/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/app/redux"
import AdminReportCard from "./forms/admin-report-card"
import { ChevronLeft, ChevronRight } from "lucide-react" // icon

const ITEMS_PER_PAGE = 4

export default function AdminReportView() {
  const userId = useAppSelector((state) => state.auth.userId)
  const { data: reportsData, isLoading, refetch } = useGetReportsQuery()

  const reportsForAdmin = useMemo(() => {
    if (!reportsData || !userId) return []
    return reportsData.filter((r) => r.submitted_to_id === userId)
  }, [reportsData, userId])

  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Pending_Review' | 'Approved' | 'Rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredReports = useMemo(() => {
    if (selectedStatus === 'all') return reportsForAdmin
    return reportsForAdmin.filter((r) => r.report_status === selectedStatus)
  }, [reportsForAdmin, selectedStatus])

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE)
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredReports.slice(start, end)
  }, [filteredReports, currentPage])

  // Reset về trang 1 khi đổi tab
  const handleTabChange = (value: string) => {
    setSelectedStatus(value as any)
    setCurrentPage(1)
  }

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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Tổng Báo Cáo','Chờ Duyệt','Đã Duyệt','Bị Từ Chối'].map((title, idx) => {
          let count = 0
          switch(idx) {
            case 0: count = reportsForAdmin.length; break;
            case 1: count = reportsForAdmin.filter(r => r.report_status === 'Pending_Review').length; break;
            case 2: count = reportsForAdmin.filter(r => r.report_status === 'Approved').length; break;
            case 3: count = reportsForAdmin.filter(r => r.report_status === 'Rejected').length; break;
          }
          return (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${idx===1?'text-yellow-600':idx===2?'text-green-600':idx===3?'text-red-600':''}`}>
                  {count}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={selectedStatus} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tất Cả</TabsTrigger>
          <TabsTrigger value="Pending_Review">Chờ Duyệt</TabsTrigger>
          <TabsTrigger value="Approved">Đã Duyệt</TabsTrigger>
          <TabsTrigger value="Rejected">Bị Từ Chối</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-0">
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Đang tải...</p>
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Không có báo cáo</p>
            </Card>
          ) : (
            <>
              {/* Danh sách card - 4 card/trang */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedReports.map((report) => (
                  <div key={report.report_id} className="h-full">
                    <AdminReportCard 
                      report={report} 
                      getStatusColor={getStatusColor} 
                      onReviewSuccess={() => refetch()}     
                    />
                  </div>
                ))}

                {/* Placeholder để giữ layout 2x2 nếu ít card */}
                {Array.from({ length: Math.max(0, 4 - paginatedReports.length) }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="h-full" />
                ))}
              </div>
              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-9 h-9"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}