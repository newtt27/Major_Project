// page.tsx - Đã sửa để lấy dữ liệu từ API, giữ nguyên giao diện
"use client";

import {
  CheckCircle,
  Clock,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import DashboardWrapper from "../dashboardWrapper";
import { useGetDashboardStatsQuery } from "@/state/api"; 
import { Skeleton } from "@/components/ui/skeleton"; 

// Màu mặc định cho biểu đồ
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const Dashboard = () => {
  const { data, isLoading, error } = useGetDashboardStatsQuery(); // Lấy dữ liệu từ API

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" /> {/* Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48 col-span-2" />
          </div>
          <Skeleton className="h-32" /> {/* Quick Actions */}
        </div>
      </DashboardWrapper>
    );
  }

  if (error) {
    return (
      <DashboardWrapper>
        <div className="text-red-500">Lỗi khi tải dữ liệu dashboard</div>
      </DashboardWrapper>
    );
  }

  // Dữ liệu từ API
  const {
    totalProjects = 0,
    activeProjects = 0,
    completedProjects = 0,
    totalTasks = 0,
    pendingTasks = 0,
    inProgressTasks = 0,
    doneTasks = 0,
    overdueTasks = 0,
    totalUsers = 0,
    activeUsers = 0,
    departmentTaskLoad = [],
    weeklyTaskProgress = [],
    projectStatus = [],
    topPerformers = [],
  } = data || {};

  const projectGrowth = 12; 
  const performanceIncrease = 18;

  return (
    <DashboardWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-gray-500">Cập nhật đến: 13/11/2025</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalProjects}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{projectGrowth}% so với tháng trước
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nhiệm vụ đang làm</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressTasks}</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {pendingTasks} sắp đến hạn
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoàn thành tuần này</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{doneTasks}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  +{performanceIncrease}% hiệu suất
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quá hạn</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{overdueTasks}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Cần xử lý gấp
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Progress Over Week */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tiến độ nhiệm vụ theo tuần
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTaskProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Hoàn thành" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Đang làm" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Status Pie */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Trạng thái dự án
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {projectStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Task Load */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Phân bổ nhiệm vụ theo phòng ban
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentTaskLoad} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="department_name" type="category" />
                  <Tooltip />
                  <Bar dataKey="task_count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nhân viên xuất sắc tuần này
            </h3>
            <div className="space-y-3">
              {topPerformers.map((emp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{emp.full_name}</p>
                      <p className="text-xs text-gray-500">{emp.completed_tasks} nhiệm vụ hoàn thành</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Top {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center">
              <Package className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Tạo dự án</span>
            </button>
            <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Tạo nhiệm vụ</span>
            </button>
            <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-center">
              <Users className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Gợi ý phân công</span>
            </button>
            <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-center">
              <BarChart3 className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">Xem báo cáo</span>
            </button>
          </div>
        </div> */}
      </div>
    </DashboardWrapper>
  );
};

export default Dashboard;