"use client";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useCreateTaskMutation,
  useGetUsersByDepartmentQuery,
} from "@/state/api";

interface CreateTaskFormProps {
  partId: number;
  departmentId: number; // Lấy thẳng từ URL param
  assignedTo?: number | null;
  onClose: () => void;
}

type FormState = {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | string;
  part_id: number;
  start_date: string;
  due_date: string;
  assigned_users: number[];
  main_assignee_id?: number;
};

const initialForm = (
  partId: number,
  assignedTo?: number | null
): FormState => ({
  title: "",
  description: "",
  priority: "Medium",
  part_id: partId,
  start_date: "",
  due_date: "",
  assigned_users: assignedTo ? [assignedTo] : [],
  main_assignee_id: assignedTo ?? undefined,
});

export default function CreateTaskForm({
  partId,
  departmentId,
  assignedTo,
  onClose,
}: CreateTaskFormProps) {
  const [createTask] = useCreateTaskMutation();

  // Lấy danh sách nhân viên theo departmentId trực tiếp
  const { data: usersInDept, isLoading: loadingUsers } =
    useGetUsersByDepartmentQuery(departmentId, { skip: !departmentId });

  const [formData, setFormData] = useState<FormState>(
    initialForm(partId, assignedTo)
  );
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});

  // Reset form khi partId hoặc assignedTo thay đổi
  useEffect(() => {
    setFormData((prev) => ({
      ...initialForm(partId, assignedTo),
      title: prev.title,
      description: prev.description,
    }));
  }, [partId, assignedTo]);

  // Validation
  useEffect(() => {
    const newErrors: typeof errors = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề là bắt buộc.";

    if (!formData.start_date || !formData.due_date)
      newErrors.date = "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.";
    else if (
      new Date(formData.start_date).getTime() >
      new Date(formData.due_date).getTime()
    )
      newErrors.date = "Ngày bắt đầu không thể lớn hơn ngày kết thúc.";

    setErrors(newErrors);
  }, [formData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions).map((o) =>
      Number(o.value)
    );
    setFormData((prev) => ({ ...prev, assigned_users: selectedIds }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Vui lòng sửa lỗi trên form trước khi gửi.");
      return;
    }

    try {
      await createTask(formData).unwrap();
      toast.success("Tạo nhiệm vụ thành công!");
      onClose();
    } catch (err: any) {
      console.error("Create task failed:", err);
      toast.error(
        err?.data?.message || "Không thể tạo nhiệm vụ. Vui lòng thử lại!"
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white rounded-2xl shadow-md max-w-xl mx-auto"
      noValidate
    >
      <h2 className="text-xl font-semibold mb-4">Tạo Nhiệm Vụ Mới</h2>

      {/* Tiêu đề */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Tiêu đề</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full border p-2 rounded-lg ${
            errors.title ? "border-red-500" : ""
          }`}
          required
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      {/* Mô tả */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Mô tả</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded-lg"
          rows={3}
        />
      </div>

      {/* Độ ưu tiên */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Độ ưu tiên</label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full border p-2 rounded-lg"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      {/* Ngày bắt đầu & hạn chót */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block font-medium mb-1">Ngày bắt đầu *</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className={`w-full border p-2 rounded-lg ${
              errors.date ? "border-red-500" : ""
            }`}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Ngày kết thúc *</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className={`w-full border p-2 rounded-lg ${
              errors.date ? "border-red-500" : ""
            }`}
            required
          />
        </div>
      </div>
      {errors.date && (
        <p className="text-sm text-red-500 mb-3">{errors.date}</p>
      )}

      {/* Người được giao */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Người được giao</label>
        {loadingUsers ? (
          <p className="border p-2 rounded-lg bg-gray-50">Đang tải...</p>
        ) : usersInDept?.data?.length ? (
          <select
            name="assigned_users"
            multiple
            value={formData.assigned_users.map(String)}
            onChange={handleAssignedChange}
            className="w-full border p-2 rounded-lg"
          >
            {usersInDept.data.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name}{" "}
                {u.position ? `(${u.position})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="border p-2 rounded-lg bg-yellow-50 text-yellow-800">
            ⚠️ Không có nhân viên nào trong phòng ban.
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={`px-4 py-2 rounded-lg text-white ${
            isValid
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Tạo
        </button>
      </div>
    </form>
  );
}
