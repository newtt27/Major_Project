"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useUpdateProjectPartMutation,
  useGetDepartmentsQuery,
  useGetUsersQuery,
  ProjectPart,
  Department,
  User,
} from "@/state/api";
import { toast } from "react-hot-toast";
interface EditPartFormProps {
  part: ProjectPart;
  onSuccess?: () => void;
  onClose?: () => void;
}

const EditPartForm = ({ part, onSuccess, onClose }: EditPartFormProps) => {
  const [name, setName] = useState(part.part_name);
  const [description, setDescription] = useState(part.description ?? "");
  const [status, setStatus] = useState(part.status);

  const [departmentId, setDepartmentId] = useState<number | null>(
    part.department_id ?? null
  );
  const [assignedTo, setAssignedTo] = useState<number | null>(
    part.assigned_to ?? null
  );

  const [startDate, setStartDate] = useState(part.start_date ?? "");
  const [dueDate, setDueDate] = useState(part.due_date ?? "");

  const { data: deptResponse, isLoading: loadingDepts } =
    useGetDepartmentsQuery();
  const { data: userResponse, isLoading: loadingUsers } = useGetUsersQuery();

  const departments: Department[] = deptResponse?.data ?? [];
  const users: User[] = userResponse?.data ?? [];

  const [updateProjectPart, { isLoading }] = useUpdateProjectPartMutation();

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      setDepartmentId(Number(id));
      setAssignedTo(null); // chọn department → clear user
    } else {
      setDepartmentId(null); // clear select → cho phép chọn user
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      setAssignedTo(Number(id));
      setDepartmentId(null); // chọn user → clear department
    } else {
      setAssignedTo(null); // clear select → cho phép chọn department
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProjectPart({
        id: part.part_id,
        data: {
          part_name: name,
          description,
          status,
          department_id: departmentId ?? null, // nếu null thì gửi null
          assigned_to: assignedTo ?? null,
          start_date: startDate || null,
          due_date: dueDate || null,
        },
      }).unwrap();
      toast.success("Cập nhật phần dự án thành công!");
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update part:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Chỉnh sửa phần dự án</h2>

      {/* Tên phần */}
      <div>
        <label className="block text-sm font-medium mb-1">Tên phần</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium mb-1">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Trạng thái */}
      <div>
        <label className="block text-sm font-medium mb-1">Trạng thái</label>
        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as "Planning" | "Active" | "Completed" | "Inactive"
            )
          }
          className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Chọn Department hoặc User */}
      {!assignedTo && (
        <div>
          <label className="block text-sm font-medium mb-1">Phòng ban</label>
          <select
            value={departmentId ?? ""}
            onChange={handleDepartmentChange}
            disabled={loadingDepts}
            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-- Chọn phòng ban --</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!departmentId && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Người phụ trách (User)
          </label>
          <select
            value={assignedTo ?? ""}
            onChange={handleUserChange}
            disabled={loadingUsers}
            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-- Chọn người phụ trách --</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Ngày bắt đầu & kết thúc */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
          <input
            type="date"
            value={startDate ? startDate.split("T")[0] : ""}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Ngày kết thúc
          </label>
          <input
            type="date"
            value={dueDate ? dueDate.split("T")[0] : ""}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-6">
        <Button
          type="submit"
          className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
};

export default EditPartForm;
