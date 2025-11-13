"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useUpdateProjectMutation } from "@/state/api";

type ProjectStatus = "Planning" | "Active" | "Completed" | "Inactive";

interface Project {
  project_id: number;
  project_name: string;
  description: string;
  status: ProjectStatus;
}

interface UpdateProjectFormProps {
  project: Project;
  onSuccess?: () => void;
  onClose?: () => void;
}

const UpdateProjectForm = ({
  project,
  onSuccess,
  onClose,
}: UpdateProjectFormProps) => {
  const [formData, setFormData] = useState<{
    project_name: string;
    description: string;
    status: ProjectStatus;
  }>({
    project_name: project.project_name,
    description: project.description || "",
    status: project.status,
  });

  const [updateProject, { isLoading }] = useUpdateProjectMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ Gọi mutation đúng kiểu { id, data }
      await updateProject({
        id: Number(project.project_id),
        data: formData,
      }).unwrap();

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
      alert("Cập nhật dự án thất bại. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-blue-500 mb-4">
          Cập nhật dự án
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tên dự án */}
          <input
            name="project_name"
            value={formData.project_name}
            onChange={(e) =>
              setFormData({ ...formData, project_name: e.target.value })
            }
            placeholder="Tên dự án"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={isLoading}
          />

          {/* Mô tả */}
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Mô tả dự án"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          />

          {/* Trạng thái */}
          <select
            name="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as ProjectStatus,
              })
            }
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          >
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Nút hành động */}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Đang lưu..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProjectForm;
