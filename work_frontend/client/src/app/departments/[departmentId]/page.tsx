"use client";

import { useParams } from "next/navigation";
import {
  useGetDepartmentByIdQuery,
  useGetUsersByDepartmentQuery,
} from "@/state/api";
import { User, Department } from "@/state/api";
import DashboardWrapper from "../../dashboardWrapper"; 
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
export default function DepartmentDetailPage() {
  const router = useRouter();
  const { departmentId } = useParams<{ departmentId: string }>();
  const depId = Number(departmentId);

  // ===== API CALLS =====
  const {
    data: departmentResponse,
    isLoading: depLoading,
    error: depError,
  } = useGetDepartmentByIdQuery(depId);

  const {
    data: usersResponse,
    isLoading: usersLoading,
    error: usersError,
  } = useGetUsersByDepartmentQuery(depId);

  const department: Department | undefined = departmentResponse?.data;
  const users: User[] = usersResponse?.data ?? [];

  // ===== LOADING =====
  if (depLoading || usersLoading) {
    return (
      <DashboardWrapper>
        <p className="p-6 text-gray-500">Đang tải dữ liệu...</p>
      </DashboardWrapper>
    );
  }

  // ===== ERROR =====
  if (depError || usersError || !department) {
    return (
      <DashboardWrapper>
        <p className="p-6 text-red-500">
          Lỗi khi tải thông tin phòng ban hoặc không tìm thấy dữ liệu.
        </p>
      </DashboardWrapper>
    );
  }

  // ===== FIND MANAGER =====
  const manager = users.find((u) => u.user_id === department.manager_id);

  return (
    <DashboardWrapper>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/departments")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 mb-6"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>
        {/* Header */}
        <h1 className="text-2xl font-bold mb-4 text-blue-600">
          Chi tiết phòng ban: {department.department_name}
        </h1>

        {/* Department Info */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50 shadow-sm">
          <p className="mb-2">
            <strong>Mô tả:</strong> {department.description || "Không có mô tả"}
          </p>
          <p className="mb-2">
            <strong>Trạng thái:</strong>{" "}
            <span
              className={`px-2 py-1 rounded text-sm ${
                department.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {department.status}
            </span>
          </p>
          {/* <p>
            <strong>Trưởng phòng:</strong>{" "}
            {manager
              ? `${manager.first_name} ${manager.last_name}`
              : "Chưa có trưởng phòng"}
          </p> */}
        </div>

        {/* Users Table */}
        <h2 className="text-xl font-semibold mb-3">Danh sách nhân viên</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">
            Không có thành viên nào trong phòng ban này.
          </p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-2 border">#</th>
                  <th className="px-4 py-2 border">Họ tên</th>
                  <th className="px-4 py-2 border">Chức vụ</th>
                  <th className="px-4 py-2 border">Số điện thoại</th>
                  <th className="px-4 py-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr
                    key={u.user_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-2 border">{index + 1}</td>
                    <td className="px-4 py-2 border">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-4 py-2 border">
                      {u.user_id === department.manager_id ? (
                        <span className="text-blue-600 font-medium">
                          Trưởng phòng
                        </span>
                      ) : (
                        u.position || "Nhân viên"
                      )}
                    </td>
                    <td className="px-4 py-2 border">{u.phone}</td>
                    <td className="px-4 py-2 border">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          u.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
}
