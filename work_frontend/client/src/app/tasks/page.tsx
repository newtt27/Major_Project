"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DashboardWrapper from "../dashboardWrapper";
import { ArrowRight } from "lucide-react";
import { useGetMyTasksQuery, Task } from "@/state/api";
import { Edit2, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-gray-300 text-gray-800", // Chưa bắt đầu
  in_progress: "bg-blue-300 text-blue-800", // Đang làm
  review: "bg-yellow-300 text-yellow-800", // Đang review
  done: "bg-green-300 text-green-800", // Hoàn thành
  archived: "bg-purple-300 text-purple-800", // Lưu trữ / đóng lại
};

const priorityColors: Record<string, string> = {
  High: "text-red-500 font-semibold",
  Medium: "text-yellow-500 font-medium",
  Low: "text-green-500 font-medium",
};

const TasksPage = () => {
  const router = useRouter();
  const { data, isLoading, isError } = useGetMyTasksQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const tasks: Task[] = data?.data || [];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(tasks.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading)
    return (
      <DashboardWrapper>
        <p className="text-center text-gray-500">Đang tải nhiệm vụ...</p>
      </DashboardWrapper>
    );

  if (isError)
    return (
      <DashboardWrapper>
        <p className="text-center text-red-500">Lỗi khi tải nhiệm vụ</p>
      </DashboardWrapper>
    );

  return (
    <DashboardWrapper>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">My Tasks</h1>

        <div className="overflow-x-auto rounded-2xl shadow-md bg-white dark:bg-gray-800">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 text-left">
              <tr>
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">Task</th>
                <th className="p-3 font-semibold">Project</th>
                <th className="p-3 font-semibold">Part</th>
                <th className="p-3 font-semibold">Priority</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Due Date</th>
                <th className="p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-gray-500">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                currentTasks.map((task: Task) => {
                  const statusClass =
                    statusColors[task.status_name.toLowerCase()] ||
                    "bg-gray-200 text-gray-800";

                  return (
                    <tr
                      key={task.task_id}
                      className="border-t border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-3 font-medium text-gray-700 dark:text-gray-200">
                        #{task.task_id}
                      </td>
                      <td className="p-3">{task.title}</td>
                      <td className="p-3">{task.project_name || "—"}</td>
                      <td className="p-3">{task.part_name || "—"}</td>
                      <td className={`p-3 ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                        >
                          {task.status_name.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className="p-3 flex gap-2">
                        {/* Nút cập nhật task */}
                        <button
                          onClick={() =>
                            router.push(`/tasks/${task.task_id}/update`)
                          }
                          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                          title="Cập nhật tiến độ"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Nút xem chi tiết */}
                        <button
                          onClick={() => router.push(`/tasks/${task.task_id}`)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
            Trước
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-300">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            Sau
          </button>
        </div>
      </div>
    </DashboardWrapper>
  );
};

export default TasksPage;
