// app/roles/assign/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useAssignPermissionToRoleMutation,
  useDeletePermissionFromRoleMutation,
} from "@/state/api";
import { toast } from "react-hot-toast";

interface Permission {
  permission_id: number;
  permission_name: string;
  category?: string;
}

interface AssignPermissionsFormProps {
  role: { role_id: number; role_name: string };
  onSuccess?: () => void;
}

const AssignPermissionsForm: React.FC<AssignPermissionsFormProps> = ({ role, onSuccess }) => {
  const { data: allPermissionsRaw, isLoading: loadingAll } = useGetPermissionsQuery();
  
  const { data: currentPermissions = [], isLoading: loadingCurrent } = useGetRolePermissionsQuery(role.role_id);
  const [assign, { isLoading: assigning }] = useAssignPermissionToRoleMutation();
  const [remove, { isLoading: removing }] = useDeletePermissionFromRoleMutation();

  const [selected, setSelected] = useState<number[]>([]);

  // Ensure we always work with an array (handle cases where API returns { data: [...] } or similar)
  const permsList: Permission[] = Array.isArray(allPermissionsRaw)
    ? allPermissionsRaw
    : Array.isArray((allPermissionsRaw as any)?.data)
    ? (allPermissionsRaw as any).data
    : [];

  useEffect(() => {
  if (currentPermissions && currentPermissions.length > 0) {
    const ids = currentPermissions.map(p => p.permission_id);
    setSelected(prev => {
      const isSame = prev.length === ids.length && prev.every(id => ids.includes(id));
      return isSame ? prev : ids;
    });
  }
}, [currentPermissions]);

  // Group by category (memoized)
  const { grouped, categories } = useMemo(() => {
    const g: Record<string, Permission[]> = {};
    permsList.forEach((perm) => {
      const cat = perm.category || "Khác";
      if (!g[cat]) g[cat] = [];
      g[cat].push(perm);
    });
    const cats = Object.keys(g).sort();
    return { grouped: g, categories: cats };
  }, [permsList]);

  const togglePermission = (id: number, checked: boolean) => {
    setSelected(prev => (checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id)));
  };

  const toggleCategory = (cat: string, checked: boolean) => {
    const ids = grouped[cat].map(p => p.permission_id);
    setSelected(prev =>
      checked ? Array.from(new Set([...prev.filter(id => !ids.includes(id)), ...ids])) : prev.filter(id => !ids.includes(id))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentPermsArray: Permission[] = Array.isArray(currentPermissions)
      ? currentPermissions
      : Array.isArray((currentPermissions as any)?.data)
      ? (currentPermissions as any).data
      : [];

    const toAdd = selected.filter(id => !currentPermsArray.some(p => p.permission_id === id));
    const toRemove = currentPermsArray.filter(p => !selected.includes(p.permission_id)).map(p => p.permission_id);

    try {
      await Promise.all([
        ...toAdd.map(id => assign({ role_id: role.role_id, permission_id: id }).unwrap()),
        ...toRemove.map(id => remove({ role_id: role.role_id, permission_id: id }).unwrap()),
      ]);
      toast.success("Cập nhật quyền thành công!");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Loading / empty guard
  if (loadingAll || loadingCurrent) {
    return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu quyền...</div>;
  }

  if (!permsList.length) {
    return <div className="p-6 text-center text-gray-500">Không có quyền nào để hiển thị.</div>;
  }

  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="text-purple-600" />
        Gán quyền cho: <span className="text-purple-600">{role.role_name}</span>
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg border overflow-x-auto min-h-96">
          <div className="flex gap-6 p-4 min-w-max">
            {categories.map((cat) => {
              const perms = grouped[cat];
              const allChecked = perms.every(p => selected.includes(p.permission_id));
              // const someChecked = perms.some(p => selected.includes(p.permission_id));

              return (
                <div
                  key={cat}
                  className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-4 shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-800">{cat}</h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {perms.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {perms.map((perm) => (
                      <label
                        key={perm.permission_id}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(perm.permission_id)}
                          onChange={(e) => togglePermission(perm.permission_id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600"
                        />
                        <span className="text-sm font-medium truncate">
                          {perm.permission_name}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => toggleCategory(cat, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-xs font-medium text-gray-600">
                      {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          disabled={assigning || removing || loadingCurrent}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
        >
          {assigning || removing ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </form>
    </div>
  );
};

export default AssignPermissionsForm;
