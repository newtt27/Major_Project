"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useCreateProjectPartMutation,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  Department,
  User,
} from "@/state/api";
import { toast } from "react-hot-toast";

interface NewPartRequest {
  project_id: number;
  part_name: string;
  description?: string;
  status?: string;
  department_id?: number | null;
  assigned_to?: number | null;
  start_date?: string | null;
  due_date?: string | null;
}

interface NewPartFormProps {
  projectId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

type PartStatus = "Planning" | "Active" | "Completed" | "Inactive";

export default function NewPartForm({
  projectId,
  onSuccess,
  onClose,
}: NewPartFormProps) {
  const { data: departmentResponse, isLoading: loadingDepts } =
    useGetDepartmentsQuery();
  const { data: userResponse, isLoading: loadingUsers } = useGetUsersQuery();

  const departments: Department[] = departmentResponse?.data ?? [];
  const users: User[] = userResponse?.data ?? [];

  const [createPart, { isLoading }] = useCreateProjectPartMutation();

  const [formData, setFormData] = useState({
    part_name: "",
    description: "",
    status: "Planning" as PartStatus,
    department_id: "" as string | number,
    assigned_to: "" as string | number,
    start_date: "",
    due_date: "",
  });

  const [errors, setErrors] = useState<{
    part_name?: string;
    assignee?: string;
    date?: string;
  }>({});

  // handle department/user selection
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      department_id: deptId ? Number(deptId) : "",
      assigned_to: "",
    }));
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      assigned_to: userId ? Number(userId) : "",
      department_id: "",
    }));
  };

  // validation
  useEffect(() => {
    const newErrors: typeof errors = {};

    // part_name required
    if (!formData.part_name.trim()) {
      newErrors.part_name = "Tên phần là bắt buộc.";
    }

    // must choose either department or assigned_to
    if (!formData.department_id && !formData.assigned_to) {
      newErrors.assignee = "Phải chọn phòng ban hoặc người phụ trách.";
    }

    // date validation
    if (formData.start_date && formData.due_date) {
      const start = new Date(formData.start_date).getTime();
      const due = new Date(formData.due_date).getTime();
      if (isNaN(start) || isNaN(due)) {
        newErrors.date = "Ngày không hợp lệ.";
      } else if (start > due) {
        newErrors.date = "Ngày bắt đầu không được lớn hơn ngày kết thúc.";
      }
    }

    setErrors(newErrors);
  }, [formData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Vui lòng sửa lỗi trước khi gửi.");
      return;
    }

    const payload: NewPartRequest = {
      project_id: projectId,
      part_name: formData.part_name.trim(),
      description: formData.description.trim() || "",
      status: formData.status,
      department_id: formData.department_id
        ? Number(formData.department_id)
        : null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
    };

    try {
      await createPart(payload).unwrap();
      toast.success("Thêm phần dự án thành công!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Create part failed:", err);
      toast.error("Không thể thêm phần dự án!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-blue-500 mb-4">
          Thêm phần dự án mới
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              value={formData.part_name}
              onChange={(e) =>
                setFormData({ ...formData, part_name: e.target.value })
              }
              placeholder="Tên phần"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 ${
                errors.part_name ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.part_name && (
              <p className="text-sm text-red-500 mt-1">{errors.part_name}</p>
            )}
          </div>

          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Mô tả phần"
            rows={3}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          />

          {!formData.assigned_to && (
            <select
              value={formData.department_id}
              onChange={handleDepartmentChange}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 ${
                errors.assignee ? "border-red-500" : ""
              }`}
              disabled={loadingDepts || isLoading}
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          )}

          {!formData.department_id && (
            <select
              value={formData.assigned_to}
              onChange={handleUserChange}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 ${
                errors.assignee ? "border-red-500" : ""
              }`}
              disabled={loadingUsers || isLoading}
            >
              <option value="">-- Chọn người phụ trách --</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          )}
          {errors.assignee && (
            <p className="text-sm text-red-500">{errors.assignee}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              disabled={isLoading}
            />
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
              disabled={isLoading}
            />
          </div>
          {errors.date && (
            <p className="text-sm text-red-500 mt-1">{errors.date}</p>
          )}

          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as PartStatus })
            }
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
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
}
