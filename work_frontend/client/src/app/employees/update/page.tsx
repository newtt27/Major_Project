"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useGetDepartmentsQuery,
  useUpdateUserMutation,
  Department,
  User,
} from "@/state/api";

interface UpdateEmployeeFormProps {
  employee: User; // Chỉ cần dữ liệu user
  onSuccess?: () => void;
}

const UpdateEmployeeForm: React.FC<UpdateEmployeeFormProps> = ({
  employee,
  onSuccess,
}) => {
  // ===== STATE =====
  const [first_name, setFirstName] = useState(employee.first_name);
  const [last_name, setLastName] = useState(employee.last_name);
  const [phone, setPhone] = useState(employee.phone || "");
  const [department_id, setDepartmentId] = useState<number | null>(
    employee.department_id || null
  );

  // ===== API =====
  const {
    data: departmentsResponse,
    isLoading: depLoading,
    error: depError,
  } = useGetDepartmentsQuery();
  const departments: Department[] = departmentsResponse?.data ?? [];

  const [updateUser] = useUpdateUserMutation();

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!first_name || !last_name) {
      toast.error("⚠️ Vui lòng điền Họ và Tên!");
      return;
    }

    if (!/^[0-9]{9,11}$/.test(phone)) {
      toast.error("Số điện thoại không hợp lệ (9-11 chữ số)");
      return;
    }

    try {
      // 🔹 Chỉ update user
      await updateUser({
        id: employee.user_id,
        body: { first_name, last_name, phone, department_id },
      }).unwrap();

      toast.success("Cập nhật thông tin thành công!");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại!");
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Cập nhật thông tin nhân viên</h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Họ */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Họ</label>
          <input
            type="text"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            className="border rounded-lg p-2"
            required
          />
        </div>

        {/* Tên */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Tên</label>
          <input
            type="text"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            className="border rounded-lg p-2"
            required
          />
        </div>

        {/* Số điện thoại */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Nhập số điện thoại"
          />
        </div>

        {/* Phòng ban */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Phòng ban</label>
          {depLoading ? (
            <p>Đang tải danh sách phòng ban...</p>
          ) : depError ? (
            <p className="text-red-500">Lỗi tải dữ liệu phòng ban</p>
          ) : (
            <select
              value={department_id || ""}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              className="border rounded-lg p-2"
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments.map((dep) => (
                <option
                  key={dep.department_id}
                  value={dep.department_id}
                  disabled={dep.status !== "Active"}
                >
                  {dep.department_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg mt-2"
        >
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
};

export default UpdateEmployeeForm;
