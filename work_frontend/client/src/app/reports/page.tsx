"use client"

import { useSelector } from "react-redux"
import type { RootState } from "@/app/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import StaffReportView from "@/components/reports/staff-report-view"
import ManagerReportView from "@/components/reports/manager-report-view"
import AdminReportView from "@/components/reports/admin-report-view"
import { Card } from "@/components/ui/card"
import DashboardWrapper from "../dashboardWrapper";

export default function ReportsPage() {
  const router = useRouter()
  const { userId, roles, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  // Get primary role (first role in array)
  const userRole = roles?.[0]?.toLowerCase() || "staff"

  return (
    <DashboardWrapper>
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Báo Cáo Công Việc</h1>
              <p className="text-muted-foreground mt-1">
                Vai trò: <span className="font-semibold capitalize">{userRole}</span>
              </p>
            </div>
            {/* <div className="text-sm text-muted-foreground">ID: {userId}</div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 flex flex-col">
        {userRole === "staff" && <StaffReportView />}
        {userRole === "manager" && <ManagerReportView />}
        {userRole === "admin" && <AdminReportView />}


        {!["staff", "manager", "admin"].includes(userRole) && (
          <Card className="p-8 text-center">
            <p className="text-destructive font-semibold">⚠️ Vai trò không hợp lệ: {userRole}</p>
          </Card>
        )}
      </main>
    </div>
    </DashboardWrapper>
  )
}
