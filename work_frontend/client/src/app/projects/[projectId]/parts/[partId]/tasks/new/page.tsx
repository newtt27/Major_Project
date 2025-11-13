"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useCreateTaskMutation, useGetUserByIdQuery } from "@/state/api";
import toast from "react-hot-toast";

interface CreateTaskFormProps {
  partId: number;
  assignedTo?: number | null;
  onClose: () => void;
}

type FormState = {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | string;
  part_id: number;
  required_file_count: string;
  start_date: string;
  due_date: string;
  assigned_users: number[] | [];
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
  required_file_count: "",
  start_date: "",
  due_date: "",
  assigned_users: assignedTo ? [assignedTo] : [],
  main_assignee_id: assignedTo ?? undefined,
});

export default function CreateTaskForm({
  partId,
  assignedTo,
  onClose,
}: CreateTaskFormProps) {
  const [createTask] = useCreateTaskMutation();
  const { data: assignedUser } = useGetUserByIdQuery(assignedTo ?? 0, {
    skip: !assignedTo,
  });

  const [formData, setFormData] = useState<FormState>(
    initialForm(partId, assignedTo)
  );

  const [errors, setErrors] = useState<{
    title?: string;
    required_file_count?: string;
    date?: string;
  }>({});

  useEffect(() => {
    setFormData((prev) => ({
      ...initialForm(partId, assignedTo),
      title: prev.title,
      description: prev.description,
    }));
  }, [partId, assignedTo]);

  const parseDate = (d: string) => {
    if (!d) return NaN;
    return new Date(d).getTime();
  };

  // ✅ Validation cập nhật lại: bắt buộc phải có cả start_date và due_date
  useEffect(() => {
    const newErrors: typeof errors = {};

    // Tiêu đề
    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc.";
    }

    // Số file yêu cầu
    if (formData.required_file_count !== "") {
      const n = Number(formData.required_file_count);
      if (!Number.isFinite(n) || Number.isNaN(n)) {
        newErrors.required_file_count = "Phải là số hợp lệ.";
      } else if (!Number.isInteger(n)) {
        newErrors.required_file_count = "Phải là số nguyên.";
      } else if (n < 0) {
        newErrors.required_file_count = "Phải lớn hơn hoặc bằng 0.";
      }
    }

    // ✅ Ngày bắt buộc
    if (!formData.start_date || !formData.due_date) {
      newErrors.date = "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.";
    } else {
      const s = parseDate(formData.start_date);
      const d = parseDate(formData.due_date);
      if (Number.isNaN(s) || Number.isNaN(d)) {
        newErrors.date = "Ngày không hợp lệ.";
      } else if (s > d) {
        newErrors.date = "Ngày bắt đầu không thể lớn hơn ngày kết thúc.";
      }
    }

    setErrors(newErrors);
  }, [formData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Vui lòng sửa lỗi trên form trước khi gửi.");
      return;
    }

    const payload: any = {
      ...formData,
      required_file_count:
        formData.required_file_count === ""
          ? 0
          : Number(formData.required_file_count),
    };

    try {
      await createTask(payload).unwrap();
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

      {/* Số lượng file yêu cầu */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Số lượng file yêu cầu</label>
        <input
          inputMode="numeric"
          type="number"
          name="required_file_count"
          value={formData.required_file_count}
          onChange={handleChange}
          className={`w-full border p-2 rounded-lg appearance-none [-moz-appearance:textfield] ${
            errors.required_file_count ? "border-red-500" : ""
          }`}
          min={0}
          onWheel={(e) => e.currentTarget.blur()}
        />
        {errors.required_file_count && (
          <p className="text-sm text-red-500 mt-1">
            {errors.required_file_count}
          </p>
        )}
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
        {assignedTo ? (
          assignedUser ? (
            <p className="border p-2 rounded-lg bg-gray-50">
              {assignedUser.first_name} {assignedUser.last_name}{" "}
              {assignedUser.position ? `(${assignedUser.position})` : ""}
            </p>
          ) : (
            <p className="border p-2 rounded-lg bg-gray-50">Đang tải...</p>
          )
        ) : (
          <p className="border p-2 rounded-lg bg-yellow-50 text-yellow-800">
            ⚠️ Phần này chưa có người phụ trách.
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
