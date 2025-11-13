"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCreateDepartmentMutation } from "@/state/api";

interface NewDepartmentFormProps {
  onSuccess?: () => void;
}

const NewDepartmentForm: React.FC<NewDepartmentFormProps> = ({ onSuccess }) => {
  // Form fields
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");

  // API mutation
  const [createDepartment, { isLoading }] = useCreateDepartmentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!departmentName.trim()) {
      toast.error("⚠️ Vui lòng nhập tên phòng ban!");
      return;
    }

    try {
      await createDepartment({
        department_name: departmentName.trim(),
        description: description.trim(),
      }).unwrap();

      toast.success("🎉 Tạo phòng ban thành công!");

      // Reset form
      setDepartmentName("");
      setDescription("");

      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error("❌ Tạo phòng ban thất bại: " + (error?.data?.message || ""));
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">Thêm phòng ban mới</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Tên phòng ban */}
        <div className="flex flex-col">
          <label className="font-medium mb-1">Tên phòng ban</label>
          <input
            type="text"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="border rounded-lg p-2"
            placeholder="Nhập tên phòng ban..."
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-blue-500 text-white py-2 rounded-lg mt-4 hover:bg-blue-600 transition-colors ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Đang tạo..." : "Thêm mới"}
        </button>
      </form>
    </div>
  );
};

export default NewDepartmentForm;
