// app/permissions/new/page.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCreatePermissionMutation } from "@/state/api";

interface NewPermissionFormProps {
  onSuccess?: () => void;
}

const NewPermissionForm: React.FC<NewPermissionFormProps> = ({ onSuccess }) => {
  // Form fields
  const [permission_name, setPermissionName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Mutation
  const [createPermission, { isLoading }] = useCreatePermissionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!permission_name.trim()) {
    toast.error("Tên quyền không được để trống!");
    return;
  }

  try {
    await createPermission({
      permission_name: permission_name.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      status,
    }).unwrap();

    toast.success("Tạo quyền thành công!");

    // Reset form
    setPermissionName("");
    setCategory("");
    setDescription("");
    setStatus("Active");

    onSuccess?.();
  } catch (error: any) {
    console.error(error);

    const errorMessage = error?.data?.message?.toLowerCase() || "";
    if (
      error?.status === 409 ||
      errorMessage.includes("already exists") ||
      errorMessage.includes("duplicate") ||
      (errorMessage.includes("permission") && errorMessage.includes("name"))
    ) {
      toast.error("Quyền này đã tồn tại!");
    } else {
      toast.error("Tạo quyền thất bại: " + (error?.data?.message || "Lỗi không xác định"));
    }
  }
};

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Thêm quyền mới</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Tên quyền */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">
            Tên quyền <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={permission_name}
            onChange={(e) => setPermissionName(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ví dụ: view_users, create_task"
            required
          />
        </div>

        {/* Danh mục */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Danh mục</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ví dụ: User Management, Task"
          />
        </div>

        {/* Mô tả */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Mô tả chi tiết quyền này dùng để làm gì..."
          />
        </div>

        {/* Trạng thái */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 transition-colors font-medium ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Đang tạo..." : "Thêm quyền"}
        </button>
      </form>
    </div>
  );
};

export default NewPermissionForm;