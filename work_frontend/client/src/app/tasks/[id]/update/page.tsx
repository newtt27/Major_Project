"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardWrapper from "@/app/dashboardWrapper";
import {
  useGetTaskFullDetailQuery,
  useUpdateTaskProgressMutation,
} from "@/state/api";
import { toast } from "react-hot-toast";

// ===================== Interfaces =====================
interface TaskAssignment {
  assignment_id: number;
  task_id: number;
  user_id: number;
  is_main_assignee: boolean;
  first_name: string;
  last_name: string;
}

interface TaskProgress {
  progress_id: number;
  task_id: number;
  percentage_complete: number;
  milestone_description?: string | null;
  updated_at: string;
  updated_by?: number;
  first_name?: string;
  last_name?: string;
}

interface TaskFullDetail {
  task_id: number;
  title: string;
  description?: string | null;
  priority: "Low" | "Medium" | "High";
  status_name: string;
  start_date?: string | null;
  due_date?: string | null;
  percentage_complete: number;
  assigned_by_first_name?: string | null;
  assigned_by_last_name?: string | null;
  assignments: TaskAssignment[];
  progresses: TaskProgress[];
}

// ===================== Component =====================
interface PageProps {
  params: { id: string };
}

const TaskUpdatePage = ({ params }: PageProps) => {
  const taskId = Number(params.id);
  const router = useRouter();

  const {
    data: taskResponse,
    isLoading,
    error,
  } = useGetTaskFullDetailQuery(taskId);

  const [updateProgress, { isLoading: updating }] =
    useUpdateTaskProgressMutation();

  const [progress, setProgress] = useState<number>(0);
  const [milestone, setMilestone] = useState<string>("");

  const task = taskResponse?.data as TaskFullDetail | undefined;

  useEffect(() => {
    if (task) {
      // Lấy tiến độ mới nhất từ mảng progresses (phần tử cuối cùng)
      const latest = task.progresses?.[task.progresses.length - 1];
      const latestProgress =
        latest?.percentage_complete ?? task.percentage_complete ?? 0;

      setProgress(latestProgress);

      if (latest?.milestone_description) {
        setMilestone(latest.milestone_description);
      }
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task) return;
    try {
      const isDone = progress === 100;

      const payload = {
        id: taskId,
        progress_percentage: progress,
        milestone_description: milestone.trim() || undefined,
        is_tick_complete: isDone,
      };

      await updateProgress(payload).unwrap();

      toast.success("Cập nhật tiến độ thành công!");
      router.push("/tasks");
    } catch (err: any) {
      toast.error(err?.data?.message || "Cập nhật thất bại");
      console.error("Lỗi khi cập nhật task:", err);
    }
  };

  // Loading & Error
  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-gray-500">Đang tải task...</div>
        </div>
      </DashboardWrapper>
    );
  }

  if (error || !task) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <p>Không tìm thấy task hoặc bạn không có quyền truy cập.</p>
          <button
            onClick={() => router.push("/tasks")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </DashboardWrapper>
    );
  }

  const mainAssignee = task.assignments.find((a) => a.is_main_assignee);
  const otherAssignees = task.assignments.filter((a) => !a.is_main_assignee);

  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    review: "bg-yellow-100 text-yellow-800",
    done: "bg-green-100 text-green-800",
    archived: "bg-purple-100 text-purple-800",
  };

  const priorityColors: Record<string, string> = {
    High: "text-red-600 font-bold",
    Medium: "text-yellow-600 font-semibold",
    Low: "text-green-600 font-medium",
  };

  return (
    <DashboardWrapper>
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Cập nhật Task #{task.task_id} - {task.title}
          </h1>
          <button
            onClick={() => router.push("/tasks")}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Quay lại
          </button>
        </div>

        {/* Task Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Người giao</p>
              <p className="font-medium">
                {task.assigned_by_first_name} {task.assigned_by_last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Assignee chính</p>
              <p className="font-medium">
                {mainAssignee
                  ? `${mainAssignee.first_name} ${mainAssignee.last_name}`
                  : "Chưa có"}
              </p>
            </div>
            {otherAssignees.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Assignee phụ</p>
                <p className="font-medium">
                  {otherAssignees
                    .map((a) => `${a.first_name} ${a.last_name}`)
                    .join(", ")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Priority</p>
              <p className={priorityColors[task.priority]}>{task.priority}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[task.status_name.toLowerCase()] ||
                  statusColors.pending
                }`}
              >
                {task.status_name.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Update */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4">
          <h3 className="font-semibold text-lg">Cập nhật tiến độ</h3>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Phần trăm hoàn thành
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-bold text-lg">{progress}%</span>
                <span>100%</span>
              </div>
            </div>

            <button
              onClick={() => setProgress(100)}
              className={`px-5 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                progress === 100
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {progress === 100 ? "Hoàn thành" : "Tick hoàn thành"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mô tả milestone
            </label>
            <textarea
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              placeholder="Mô tả công việc đã hoàn thành..."
              className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleSubmit}
            disabled={updating}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? "Đang cập nhật..." : "Cập nhật Task"}
          </button>
          <button
            onClick={() => router.push("/tasks")}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition"
          >
            Hủy
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </DashboardWrapper>
  );
};

export default TaskUpdatePage;
