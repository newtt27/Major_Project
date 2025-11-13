// app/permissions/update/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUpdatePermissionMutation } from "@/state/api";

interface UpdatePermissionFormProps {
  permission: {
    permission_id: number;
    permission_name: string;
    category?: string;
    description?: string;
    status: "Active" | "Inactive";
  };
  onSuccess?: () => void;
}

const UpdatePermissionForm: React.FC<UpdatePermissionFormProps> = ({ permission, onSuccess }) => {
  const [permission_name, setPermissionName] = useState(permission.permission_name);
  const [category, setCategory] = useState(permission.category || "");
  const [description, setDescription] = useState(permission.description || "");
  const [status, setStatus] = useState<"Active" | "Inactive">(permission.status);

  const [updatePermission, { isLoading }] = useUpdatePermissionMutation();

  useEffect(() => {
    setPermissionName(permission.permission_name);
    setCategory(permission.category || "");
    setDescription(permission.description || "");
    setStatus(permission.status);
  }, [permission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!permission_name.trim()) {
      toast.error("Tên quyền không được để trống!");
      return;
    }

    try {
      await updatePermission({
        id: permission.permission_id,
        body: {
          permission_name: permission_name.trim(),
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          status,
        },
      }).unwrap();

      toast.success("Cập nhật quyền thành công!");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Cập nhật thất bại: " + (error?.data?.message || ""));
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Sửa quyền</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Giống NewPermissionForm */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">
            Tên quyền <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={permission_name}
            onChange={(e) => setPermissionName(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-1">Danh mục</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

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

export default UpdatePermissionForm;