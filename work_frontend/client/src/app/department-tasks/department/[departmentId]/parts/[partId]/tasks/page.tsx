"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import DashboardWrapper from "@/app/dashboardWrapper";
import { useGetTasksByPartIdQuery, Task } from "@/state/api";
import CreateTaskForm from "./new/page";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-300 text-yellow-800",
  in_progress: "bg-blue-300 text-blue-800",
  review: "bg-orange-300 text-orange-800",
  done: "bg-green-300 text-green-800",
  archived: "bg-gray-300 text-gray-800",
};

const DepartmentTasksPage = () => {
  const router = useRouter();
  const { partId, departmentId } = useParams();

  // ===== Queries =====
  const {
    data: tasksData,
    isLoading,
    isError,
    refetch,
  } = useGetTasksByPartIdQuery(Number(partId));

  // ===== Pagination =====
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const tasks: Task[] = tasksData?.data || [];
  const totalPages = Math.max(1, Math.ceil(tasks.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  // ===== Modal state =====
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ===== UI states =====
  if (isLoading) return <p>Đang tải nhiệm vụ...</p>;
  if (isError) return <p>Lỗi khi tải nhiệm vụ</p>;

  return (
    <DashboardWrapper>
      <div className="w-full">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 mb-6"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>

        {/* Header */}
        <div className="flex items-center mb-4">
          <h1 className="text-2xl font-bold break-words">
            Danh sách nhiệm vụ của Phần #{partId}
          </h1>

          <div className="ml-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              <Plus size={16} /> Tạo nhiệm vụ
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl shadow-md bg-white dark:bg-gray-800">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">Tên nhiệm vụ</th>
                <th className="p-3 font-semibold">Mô tả</th>
                <th className="p-3 font-semibold">Trạng thái</th>
                <th className="p-3 font-semibold">Tiến độ</th>
                <th className="p-3 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.map((task: Task) => {
                const status = (task as any).status_name || "pending";
                const statusClass =
                  statusColors[status] || "bg-gray-200 text-gray-800";

                return (
                  <tr
                    key={task.task_id}
                    className="border-t border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="p-3 font-medium text-gray-700 dark:text-gray-200">
                      #{task.task_id}
                    </td>
                    <td className="p-3">{task.title}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {task.description || "Không có mô tả"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                      >
                        {status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 w-40">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${(task as any).percentage_complete ?? 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {(task as any).percentage_complete ?? 0}%
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/department-tasks/${partId}/tasks/${task.task_id}`
                          )
                        }
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            <ChevronLeft size={16} /> Trước
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-300">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            Sau <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modal tạo task */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-2xl p-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <CreateTaskForm
              onClose={() => {
                setShowCreateModal(false);
                refetch();
              }}
              partId={Number(partId)}
              departmentId={Number(departmentId)}
            />
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
};

export default DepartmentTasksPage;
