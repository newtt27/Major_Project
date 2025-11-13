// app/accounts/update/page.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Shield, User } from "lucide-react";
import {
  useGetRolesQuery,
  useUpdateAccountMutation,
} from "@/state/api";

interface UpdateAccountFormProps {
  account: any;
  onSuccess?: () => void;
}

const UpdateAccountForm: React.FC<UpdateAccountFormProps> = ({
  account,
  onSuccess,
}) => {
  // ====== STATE ======
  const [email, setEmail] = useState(account.email || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">(
    account.status || "Active"
  );
  const [role_id, setRoleId] = useState<number | null>(
    account.role?.role_id || null
  );

  // ====== API CALLS ======
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();

  // ✅ Xử lý data format
  const roles = Array.isArray(rolesData) 
    ? rolesData 
    : (rolesData as any)?.data || [];

  // ====== SUBMIT ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("⚠️ Vui lòng điền Email!");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email không hợp lệ!");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (!role_id) {
      toast.error("⚠️ Vui lòng chọn vai trò!");
      return;
    }

    try {
      const payload: any = {
        id: account.account_id,
        body: {
          email,
          status,
          role_id,
        },
      };

      // Chỉ thêm password nếu user nhập mật khẩu mới
      if (password && password.trim() !== "") {
        payload.body.password = password;
      }

      await updateAccount(payload).unwrap();

      toast.success("✅ Cập nhật tài khoản thành công!");
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(
        "❌ Cập nhật thất bại: " + (error?.data?.message || "Lỗi không xác định")
      );
    }
  };

  // ====== RENDER ======
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Cập nhật tài khoản
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
            required
          />
        </div>

        {/* Mật khẩu mới */}
        <div className="flex flex-col">
          <label className="flex items-center gap-2 font-medium mb-1">
            <Lock size={18} />
            Mật khẩu mới (để trống nếu không đổi)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
            placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
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
                  {role.status === "Inactive" && " (Vô hiệu)"}
                </option>
              ))}
            </select>
          )}
          {account.role && role_id !== account.role.role_id && (
            <p className="text-xs text-orange-500 mt-1">
              ⚠️ Vai trò hiện tại: {account.role.role_name} → Sẽ thay đổi khi lưu
            </p>
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

        {/* User Info (read-only) */}
        {account.user && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h3 className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <User size={18} />
              Thông tin User liên kết
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Họ và Tên:</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {account.user.first_name} {account.user.last_name}
                </p>
              </div>
              {account.user.phone && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Số điện thoại:</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {account.user.phone}
                  </p>
                </div>
              )}
              {account.user.position && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Vị trí:</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {account.user.position}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nút submit */}
        <button
          type="submit"
          disabled={updating || rolesLoading}
          className="bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 disabled:bg-gray-400 transition duration-200 flex items-center justify-center gap-2"
        >
          {updating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </form>
    </div>
  );
};

export default UpdateAccountForm;