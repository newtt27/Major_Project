// app/accounts/new/page.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Shield } from "lucide-react";
import {
  useGetRolesQuery,
  useCreateAccountMutation,
} from "@/state/api";

interface NewAccountFormProps {
  onSuccess?: () => void;
}

const NewAccountForm: React.FC<NewAccountFormProps> = ({ onSuccess }) => {
  // ====== STATE ======
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [role_id, setRoleId] = useState<number | null>(null);

  // ====== API CALLS ======
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();

  // ✅ Xử lý data format
  const roles = Array.isArray(rolesData) ? rolesData : (rolesData as any)?.data || [];

  // ====== SUBMIT ======
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error("⚠️ Vui lòng điền Email và Mật khẩu!");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error("Email không hợp lệ!");
    return;
  }

  if (password.length < 6) {
    toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  if (!role_id) {
    toast.error("⚠️ Vui lòng chọn vai trò!");
    return;
  }

  try {
    const payload = {
      email,
      password,
      status,
      role_id,
    };

    console.log('🔄 Sending create account request:', payload);

    // Thêm debug cho mutation
    const result = await createAccount(payload);
    console.log('📨 Raw mutation result:', result);

    if ('data' in result) {
      console.log('✅ Create account success:', result.data);
      toast.success("✅ Tạo tài khoản thành công!");

      // Reset form
      setEmail("");
      setPassword("");
      setStatus("Active");
      setRoleId(null);

      onSuccess?.();
    } else if ('error' in result) {
      console.error('❌ Create account error:', result.error);
      const errorMsg = (result.error as any)?.data?.error || 
                      (result.error as any)?.data?.message || 
                      "Lỗi không xác định";
      toast.error(`❌ Tạo tài khoản thất bại: ${errorMsg}`);
    }

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    toast.error("❌ Lỗi hệ thống: " + (error?.message || "Vui lòng thử lại"));
  }
};
  // ====== RENDER ======
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Thêm tài khoản mới
        </h2>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="flex flex-col">
          <label className="flex items-center gap-2 font-medium mb-1">
            <Mail size={18} />
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
            placeholder="email@example.com"
            required
          />
        </div>

        {/* Mật khẩu */}
        <div className="flex flex-col">
          <label className="flex items-center gap-2 font-medium mb-1">
            <Lock size={18} />
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
            placeholder="Tối thiểu 6 ký tự"
            required
          />
        </div>

        {/* Vai trò (Role) */}
        <div className="flex flex-col">
          <label className="flex items-center gap-2 font-medium mb-1">
            <Shield size={18} />
            Vai trò <span className="text-red-500">*</span>
          </label>
          {rolesLoading ? (
            <div className="text-sm text-gray-500 py-2">Đang tải danh sách vai trò...</div>
          ) : (
            <select
              value={role_id ?? ""}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="" disabled>
                -- Chọn vai trò --
              </option>
              {roles.map((role: any) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                  {role.description && ` - ${role.description}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Trạng thái */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Nút submit */}
        <button
          type="submit"
          disabled={creating || rolesLoading}
          className="bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 disabled:bg-gray-400 transition duration-200 flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Đang xử lý...
            </>
          ) : (
            "Thêm tài khoản"
          )}
        </button>
      </form>
    </div>
  );
};

export default NewAccountForm;