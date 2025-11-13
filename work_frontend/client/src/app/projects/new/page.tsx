"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useCreateProjectMutation } from "@/state/api";

interface NewProjectFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

type ProjectStatus = "Planning" | "Active" | "Completed" | "Inactive";

const NewProjectForm = ({ onSuccess, onClose }: NewProjectFormProps) => {
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    status: "Planning" as ProjectStatus,
  });

  const [errors, setErrors] = useState<{ project_name?: string }>({});

  const [createProject, { isLoading }] = useCreateProjectMutation();

  // --- Validation ---
  useEffect(() => {
    const newErrors: typeof errors = {};
    if (!formData.project_name.trim()) {
      newErrors.project_name = "Tên dự án là bắt buộc.";
    }
    setErrors(newErrors);
  }, [formData.project_name]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      alert("Vui lòng sửa lỗi trước khi gửi.");
      return;
    }

    try {
      await createProject({
        ...formData,
        project_name: formData.project_name.trim(),
        description: formData.description.trim(),
      }).unwrap();

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Tạo dự án thất bại, thử lại sau.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-blue-500 mb-4">
          Tạo dự án mới
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              name="project_name"
              value={formData.project_name}
              onChange={(e) =>
                setFormData({ ...formData, project_name: e.target.value })
              }
              placeholder="Tên dự án"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.project_name ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.project_name && (
              <p className="text-sm text-red-500 mt-1">{errors.project_name}</p>
            )}
          </div>

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
              disabled={isLoading || !isValid}
              className={`px-4 py-2 rounded-lg text-white ${
                isLoading || !isValid
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isLoading ? "Đang tạo..." : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectForm;
