"use client";

import { useRouter, useParams } from "next/navigation";
import DashboardWrapper from "@/app/dashboardWrapper";
import { useGetTaskFullDetailQuery, Task } from "@/state/api";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-300 text-yellow-800",
  in_progress: "bg-blue-300 text-blue-800",
  review: "bg-orange-300 text-orange-800",
  done: "bg-green-300 text-green-800",
  archived: "bg-gray-300 text-gray-800",
};

const TaskDetailsPage = () => {
  const router = useRouter();
  const { projectId, partId, taskId } = useParams();

  // --- Lấy chi tiết task từ API ---
  const {
    data: taskData,
    isLoading,
    isError,
  } = useGetTaskFullDetailQuery(Number(taskId));

  const task: Task | undefined = taskData?.data;

  // --- Lấy trạng thái hiện tại ---
  const currentStatus = task?.status_name?.toLowerCase() || "pending";

  // --- Tính toán trạng thái thực tế ---
  const computedStatus = useMemo(() => {
    const progress = task?.progresses?.[0]?.percentage_complete ?? 0;
    if (progress === 100) return "done";
    return currentStatus;
  }, [task?.progresses, currentStatus]);

  const statusClass =
    statusColors[computedStatus] || "bg-gray-200 text-gray-800";

  const getUserName = (
    first_name?: string,
    last_name?: string,
    fallbackId?: number
  ) => {
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (fallbackId) return `User #${fallbackId}`;
    return "User #0";
  };

  // --- Render ---
  return (
    <DashboardWrapper>
      <div className="w-full p-6 space-y-6">
        {isLoading ? (
          <p>Đang tải chi tiết nhiệm vụ...</p>
        ) : isError ? (
          <p>Lỗi khi tải chi tiết nhiệm vụ</p>
        ) : !task ? (
          <p>Task không tồn tại</p>
        ) : (
          <>
            {/* Nút quay lại */}
            <button
              onClick={() =>
                router.push(`/projects/${projectId}/parts/${partId}/tasks/`)
              }
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 mb-6"
            >
              <ArrowLeft size={18} /> Quay lại phần dự án
            </button>

            {/* Tiêu đề & Trạng thái */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <h1 className="text-3xl font-bold">{task.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass}`}
              >
                {computedStatus.replace("_", " ")}
              </span>
            </div>

            {/* Thông tin task */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-2">
              <p className="text-gray-700 dark:text-gray-200">
                {task.description || "Không có mô tả"}
              </p>
              <p>
                <strong>Tiến độ:</strong>{" "}
                {task.progresses?.[0]?.percentage_complete ?? 0}%
              </p>
              <p>
                <strong>Người giao:</strong>{" "}
                {getUserName(
                  task.assigned_by_first_name,
                  task.assigned_by_last_name,
                  task.assigned_by_id ?? undefined
                )}
              </p>
              <p>
                <strong>Ngày bắt đầu:</strong>{" "}
                {task.start_date
                  ? new Date(task.start_date).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                <strong>Ngày kết thúc:</strong>{" "}
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "-"}
              </p>
            </div>

            {/* Người được giao */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-xl font-semibold mb-2">Người được giao</h2>
              <ul className="list-disc ml-6 space-y-1">
                {task.assignments?.length
                  ? task.assignments.map((a) => (
                      <li key={a.assignment_id}>
                        {getUserName(a.first_name, a.last_name, a.user_id)} -
                        Giao lúc {new Date(a.assigned_at).toLocaleString()}
                      </li>
                    ))
                  : "Chưa có người được giao"}
              </ul>
            </div>

            {/* Tiến độ */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-xl font-semibold mb-2">Tiến độ</h2>
              <ul className="list-disc ml-6 space-y-1">
                {task.progresses?.length
                  ? task.progresses.map((p) => (
                      <li key={p.progress_id}>
                        {p.percentage_complete}% -{" "}
                        {p.milestone_description || "Không có milestone"} -{" "}
                        {new Date(p.updated_at).toLocaleString()}
                      </li>
                    ))
                  : "Chưa có tiến độ"}
              </ul>
            </div>

            {/* Lịch sử */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-xl font-semibold mb-2">Lịch sử Task</h2>
              <ul className="list-disc ml-6 space-y-1">
                {task.task_history?.length
                  ? task.task_history.map((h) => (
                      <li key={h.history_id}>
                        {new Date(h.created_at).toLocaleString()} - {h.action} -{" "}
                        {h.status_id ?? "-"} -{" "}
                        {getUserName(h.first_name, h.last_name, h.user_id)}
                      </li>
                    ))
                  : "Chưa có lịch sử"}
              </ul>
            </div>
          </>
        )}
      </div>
    </DashboardWrapper>
  );
};

export default TaskDetailsPage;
