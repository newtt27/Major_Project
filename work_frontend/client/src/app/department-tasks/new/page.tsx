"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  useCreateTaskMutation,
  useGetUsersByDepartmentQuery,
} from "@/state/api";
import toast from "react-hot-toast";

interface PersonalTaskFormProps {
  departmentId: number; // dùng để lấy danh sách user trong phòng ban
  managerId: number; // user_id trưởng phòng
  onClose: () => void;
}

type FormState = {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | string;
  start_date: string;
  due_date: string;
  assigned_user?: number;
};

const initialForm = (): FormState => ({
  title: "",
  description: "",
  priority: "Medium",
  start_date: "",
  due_date: "",
  assigned_user: undefined,
});

export default function PersonalTaskForm({
  departmentId,
  managerId,
  onClose,
}: PersonalTaskFormProps) {
  const [createTask] = useCreateTaskMutation();
  const { data: users } = useGetUsersByDepartmentQuery(departmentId);

  const [formData, setFormData] = useState<FormState>(initialForm());
  const [errors, setErrors] = useState<{
    title?: string;
    date?: string;
    assigned_user?: string;
  }>({});

  // Validation
  useEffect(() => {
    const newErrors: typeof errors = {};

    if (!formData.title.trim()) newErrors.title = "Tiêu đề là bắt buộc.";

    if (!formData.start_date || !formData.due_date) {
      newErrors.date = "Vui lòng chọn ngày bắt đầu và kết thúc.";
    } else {
      const s = new Date(formData.start_date).getTime();
      const d = new Date(formData.due_date).getTime();
      if (Number.isNaN(s) || Number.isNaN(d))
        newErrors.date = "Ngày không hợp lệ.";
      else if (s > d)
        newErrors.date = "Ngày bắt đầu không thể lớn hơn ngày kết thúc.";
    }

    if (!formData.assigned_user)
      newErrors.assigned_user = "Phải chọn người được giao.";

    setErrors(newErrors);
  }, [formData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "assigned_user" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Vui lòng sửa lỗi trên form trước khi gửi.");
      return;
    }

    const payload = {
      ...formData,
      assigned_users: [formData.assigned_user!], // dấu ! chắc chắn không undefined
      assigned_by: managerId,
      is_direct_assignment: true,
      part_id: null,
    };

    try {
      await createTask(payload).unwrap();
      toast.success("Tạo task cá nhân thành công!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Tạo task thất bại, thử lại!");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white rounded-2xl shadow-md max-w-xl mx-auto"
      noValidate
    >
      <h2 className="text-xl font-semibold mb-4">Tạo Task Cá Nhân</h2>

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
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
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

      {/* Ngày */}
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
          />
        </div>
      </div>
      {errors.date && (
        <p className="text-red-500 text-sm mb-3">{errors.date}</p>
      )}

      {/* Người được giao */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Người được giao *</label>
        <select
          name="assigned_user"
          value={formData.assigned_user ?? ""}
          onChange={handleChange}
          className={`w-full border p-2 rounded-lg ${
            errors.assigned_user ? "border-red-500" : ""
          }`}
        >
          <option value="">-- Chọn người --</option>
          {users?.data?.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.first_name} {u.last_name} {u.position ? `(${u.position})` : ""}
            </option>
          ))}
        </select>
        {errors.assigned_user && (
          <p className="text-red-500 text-sm">{errors.assigned_user}</p>
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
