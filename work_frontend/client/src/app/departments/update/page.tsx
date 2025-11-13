"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useUpdateDepartmentMutation, Department } from "@/state/api";

interface UpdateDepartmentFormProps {
  department: Department;
  onSuccess?: () => void;
}

const UpdateDepartmentForm: React.FC<UpdateDepartmentFormProps> = ({
  department,
  onSuccess,
}) => {
  // ===== STATE =====
  const [department_name, setDepartmentName] = useState(
    department.department_name || ""
  );
  const [description, setDescription] = useState(department.description || "");
  const [status, setStatus] = useState(department.status || "Active");

  // ===== API =====
  const [updateDepartment, { isLoading }] = useUpdateDepartmentMutation();

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!department_name.trim()) {
      toast.error("⚠️ Vui lòng nhập tên phòng ban!");
      return;
    }

    try {
      await updateDepartment({
        id: department.department_id,
        body: {
          department_name: department_name.trim(),
          description: description.trim(),
          status,
        },
      }).unwrap();

      toast.success("🎉 Cập nhật phòng ban thành công!");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("❌ Cập nhật phòng ban thất bại!");
    }
  };

  // ===== RENDER =====
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Cập nhật phòng ban</h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Tên phòng ban */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Tên phòng ban</label>
          <input
            type="text"
            value={department_name}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="border rounded-lg p-2"
            required
            disabled={isLoading}
          />
        </div>

        {/* Mô tả */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded-lg p-2 min-h-[80px]"
            placeholder="Mô tả ngắn về phòng ban..."
            disabled={isLoading}
          />
        </div>

        {/* Trạng thái */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
            className="border rounded-lg p-2"
            disabled={isLoading}
          >
            <option value="Active">Đang hoạt động</option>
            <option value="Inactive">Ngưng hoạt động</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg mt-4 transition-colors ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
};

export default UpdateDepartmentForm;
