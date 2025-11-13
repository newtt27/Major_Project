"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Plus, List } from "lucide-react";
import DashboardWrapper from "@/app/dashboardWrapper";
import {
  useGetMyProjectPartsQuery,
  useGetDepartmentByIdQuery,
} from "@/state/api";
import CreateTaskForm from "./new/page";

const MyDepartmentPartsPage = () => {
  const router = useRouter();
  const [showPersonalTaskModal, setShowPersonalTaskModal] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);

  // === Fetch parts assigned to my department ===
  const {
    data: partsData,
    isLoading,
    isError,
    refetch,
  } = useGetMyProjectPartsQuery();

  const filteredParts = partsData?.data || [];

  // === Lấy thông tin department (trưởng phòng) ===
  const { data: departmentData } = useGetDepartmentByIdQuery(
    selectedDepartmentId!,
    {
      skip: !selectedDepartmentId,
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-500";
      case "Planning":
        return "text-yellow-500";
      case "Completed":
        return "text-blue-500";
      case "Inactive":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading)
    return (
      <DashboardWrapper>Đang tải dữ liệu phần của bạn...</DashboardWrapper>
    );
  if (isError)
    return <DashboardWrapper>Lỗi khi tải dữ liệu phần</DashboardWrapper>;

  return (
    <DashboardWrapper>
      <div className="w-full relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Các phần dự án thuộc phòng ban</h1>

          {/* Nút tạo Task cá nhân */}
          <button
            onClick={() => {
              // Giả sử tất cả phần đều cùng departmentId, lấy thằng đầu tiên
              const deptId = filteredParts[0]?.department_id;
              if (deptId) setSelectedDepartmentId(deptId);
              setShowPersonalTaskModal(true);
            }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            <Plus size={16} /> Tạo Task Cá Nhân
          </button>
        </div>

        {/* Parts list */}
        {filteredParts.length === 0 ? (
          <p>Chưa có phần nào trong department của bạn.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredParts.map((part) => (
              <div
                key={part.part_id}
                className="relative p-5 rounded-2xl shadow-md bg-white dark:bg-gray-800 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold mb-2">{part.part_name}</h3>
                {part.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {part.description}
                  </p>
                )}
                <p
                  className={`text-sm font-medium ${getStatusColor(
                    part.status
                  )}`}
                >
                  {part.status}
                </p>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() =>
                      router.push(
                        `/department-tasks/department/${part.department_id}/parts/${part.part_id}/tasks/`
                      )
                    }
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                  >
                    <List size={16} /> Xem tasks
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal tạo Task cá nhân */}
        {showPersonalTaskModal && selectedDepartmentId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-2xl p-6">
              <button
                onClick={() => setShowPersonalTaskModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              <CreateTaskForm
                departmentId={selectedDepartmentId} // để form lấy manager_id
                managerId={Number(departmentData?.data?.manager_id)} // user_id của trưởng phòng
                onClose={() => {
                  setShowPersonalTaskModal(false);
                  refetch();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
};

export default MyDepartmentPartsPage;
