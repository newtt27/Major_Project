"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUpdateRoleMutation } from "@/state/api";

interface UpdateRoleFormProps {
  role: {
    role_id: number;
    role_name: string;
    description?: string;
    status: "Active" | "Inactive";
  };
  onSuccess?: () => void;
}

const UpdateRoleForm: React.FC<UpdateRoleFormProps> = ({ role, onSuccess }) => {
  const [role_name, setRoleName] = useState(role.role_name);
  const [description, setDescription] = useState(role.description || "");
  const [status, setStatus] = useState<"Active" | "Inactive">(role.status);

  const [updateRole, { isLoading }] = useUpdateRoleMutation();

  // Sync khi mở modal
  useEffect(() => {
    setRoleName(role.role_name);
    setDescription(role.description || "");
    setStatus(role.status);
  }, [role]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!role_name.trim()) {
    toast.error("Tên vai trò không được để trống!");
    return;
  }

  try {
    await updateRole({
      id: role.role_id,
      body: {
        role_name: role_name.trim(),
        description: description.trim() || undefined,
        status,
      },
    }).unwrap();

    toast.success("Cập nhật vai trò thành công!");
    onSuccess?.();
  } catch (error: any) {
    console.error("Update role error:", error); // DEBUG

    let errorMessage = "Lỗi không xác định";
    if (error?.data?.message) errorMessage = error.data.message;
    else if (error?.message) errorMessage = error.message;
    else if (typeof error === "string") errorMessage = error;

    if (error?.status === 409 || /already exists|duplicate/i.test(errorMessage)) {
      toast.error("Tên vai trò đã tồn tại!");
    } else {
      toast.error("Cập nhật thất bại: " + errorMessage);
    }
  }
};

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Sửa vai trò</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Tên vai trò */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">
            Tên vai trò <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={role_name}
            onChange={(e) => setRoleName(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Admin, Manager..."
            required
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
            placeholder="Mô tả chi tiết vai trò này..."
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

        {/* Nút submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 transition-colors font-medium ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Đang cập nhật..." : "Cập nhật"}
        </button>
      </form>
    </div>
  );
};

export default UpdateRoleForm;