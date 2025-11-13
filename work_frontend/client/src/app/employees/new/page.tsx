"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useGetDepartmentsQuery,
  useCreateUserMutation,
  useUpdateAccountMutation,
  useGetAccountsQuery,
} from "@/state/api";

interface NewEmployeeFormProps {
  onSuccess?: () => void;
}

const NewEmployeeForm: React.FC<NewEmployeeFormProps> = ({ onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Queries
  const { data: departments, isLoading: depLoading } = useGetDepartmentsQuery();
  const { data: accountsData, isLoading: accountsLoading } = useGetAccountsQuery();

  // Mutations
  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [updateAccount, { isLoading: updatingAccount }] = useUpdateAccountMutation();

  const isSubmitting = creatingUser || updatingAccount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // === Validation ===
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Vui lòng nhập họ và tên!");
      return;
    }
    if (!departmentId) {
      toast.error("Vui lòng chọn phòng ban");
      return;
    }
    if (!/^[0-9]{9,11}$/.test(phone)) {
      toast.error("Số điện thoại không hợp lệ (9-11 chữ số)");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error("Email không hợp lệ!");
    return;
  }

    if (accountsLoading) {
      toast.error("Đang tải danh sách tài khoản...");
      return;
    }

    // === Tìm account theo email ===
    const existingAccount = accountsData?.data?.find(
      (acc: any) => acc.email.toLowerCase() === email.toLowerCase()
    );

    if (!existingAccount) {
      toast.error(`Tài khoản "${email}" chưa được tạo! Vui lòng tạo tài khoản trước.`);
      return;
    }

    if (existingAccount.user_id) {
      toast.error(`Tài khoản "${email}" đã được gán cho người dùng khác!`);
      return;
    }

    try {
      // 1. Tạo User
      const newUser = await createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        department_id: departmentId,
        status,
      }).unwrap();

      const userId = newUser.data.user_id;

      // 2. Gán user_id vào account có sẵn
      await updateAccount({
        id: existingAccount.account_id,
        body: { user_id: userId },
      }).unwrap();

      toast.success(`Đã gán tài khoản "${email}" cho nhân viên mới thành công!`);

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDepartmentId(null);
      setStatus("Active");

      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error("Gán tài khoản thất bại: " + (error?.data?.message || "Lỗi hệ thống"));
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Thêm nhân viên mới (gán tài khoản)</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Họ & Tên */}
        <div className="flex gap-4">
          <div className="flex flex-col w-1/2">
            <label className="font-medium mb-1">Họ</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border rounded-lg p-2 dark:bg-gray-700"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col w-1/2">
            <label className="font-medium mb-1">Tên</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border rounded-lg p-2 dark:bg-gray-700"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Email (tài khoản đã tạo) */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">
            Email tài khoản <span className="text-red-500">(phải đã tạo trước)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2 dark:bg-gray-700"
            placeholder="example@gmail.com"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Chỉ chấp nhận email đã tạo tài khoản và chưa gán người dùng.
          </p>
        </div>

        {/* Phone */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded-lg p-2 dark:bg-gray-700"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Department */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Phòng ban</label>
          <select
            value={departmentId ?? ""}
            onChange={(e) => setDepartmentId(Number(e.target.value))}
            className="border rounded-lg p-2 dark:bg-gray-700"
            disabled={depLoading || isSubmitting}
            required
          >
            <option value="">-- Chọn phòng ban --</option>
            {departments?.data?.map((dep: any) => (
              <option key={dep.department_id} value={dep.department_id}>
                {dep.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
            className="border rounded-lg p-2 dark:bg-gray-700"
            disabled={isSubmitting}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || accountsLoading}
          className={`bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 transition-colors font-medium ${
            isSubmitting || accountsLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Đang gán..." : "Gán tài khoản cho nhân viên"}
        </button>
      </form>
    </div>
  );
};

export default NewEmployeeForm;