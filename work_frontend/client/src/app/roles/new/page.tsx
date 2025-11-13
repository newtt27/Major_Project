// app/roles/new/page.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCreateRoleMutation } from "@/state/api";

interface NewRoleFormProps {
  onSuccess?: () => void;
}

const NewRoleForm: React.FC<NewRoleFormProps> = ({ onSuccess }) => {
  const [role_name, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [createRole, { isLoading }] = useCreateRoleMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role_name.trim()) {
      toast.error("Tên vai trò không được để trống!");
      return;
    }

    try {
      await createRole({
        role_name: role_name.trim(),
        description: description.trim() || undefined,
        status,
      }).unwrap();

      toast.success("Tạo vai trò thành công!");

      setRoleName("");
      setDescription("");
      setStatus("Active");

      onSuccess?.();
    } catch (error: any) {
      const msg = error?.data?.message?.toLowerCase() || "";
      if (error?.status === 409 || msg.includes("already exists") || msg.includes("duplicate")) {
        toast.error("Vai trò này đã tồn tại!");
      } else {
        toast.error("Tạo thất bại: " + (error?.data?.message || ""));
      }
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Thêm vai trò mới</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col">
          <label className="font-medium mb-1">
            Tên vai trò <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={role_name}
            onChange={(e) => setRoleName(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Admin, Manager..."
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border rounded-lg p-2 resize-none"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-medium mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="border rounded-lg p-2"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600"
        >
          {isLoading ? "Đang tạo..." : "Thêm vai trò"}
        </button>
      </form>
    </div>
  );
};

export default NewRoleForm;