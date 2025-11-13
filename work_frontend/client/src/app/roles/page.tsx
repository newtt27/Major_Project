// app/roles/page.tsx
"use client";

import { useState } from "react";
import DashboardWrapper from "@/app/dashboardWrapper";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Users, Plus, Pencil, Trash2, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetRolesQuery,
  useDeleteRoleMutation,
} from "@/state/api";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import NewRoleForm from "./new/page";
import UpdateRoleForm from "./update/page";
import AssignPermissionsForm from "./assign/page";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const RolesPage = () => {
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  
  // ✅ Sửa lại tên quyền cho đúng với backend
  const canCreate = permissions.includes("rbac:role:create");
  const canUpdate = permissions.includes("rbac:role:update");
  const canDelete = permissions.includes("rbac:role:delete");
  const canAssign = permissions.includes("rbac:role:assign-permission");
  const canList = permissions.includes("rbac:role:list");

  const { data: roleList = [], isLoading, isError, refetch } = useGetRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();

  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [assignRole, setAssignRole] = useState<any>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id).unwrap();
      toast.success("Xóa vai trò thành công!");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Xóa vai trò thất bại!");
    }
  };

  const columns: GridColDef[] = [
    { field: "role_id", headerName: "ID", width: 80 },
    { field: "role_name", headerName: "Tên vai trò", flex: 1, minWidth: 200 },
    {
      field: "description",
      headerName: "Mô tả",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <div className="truncate" title={params.value}>
          {params.value || "—"}
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 110,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            params.value === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center justify-center gap-1 h-full">
          {canUpdate && (
            <button
              onClick={() => {
                setEditRole(params.row);
                setAssignRole(null);
                setShowForm(true);
              }}
              className="p-2 rounded bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white transition"
              title="Sửa"
            >
              <Pencil size={16} />
            </button>
          )}
          {canAssign && (
            <button
              onClick={() => {
                setAssignRole(params.row);
                setEditRole(null);
                setShowForm(true);
              }}
              className="p-2 rounded bg-purple-100 text-purple-600 hover:bg-purple-500 hover:text-white transition"
              title="Gán quyền"
            >
              <Shield size={16} />
            </button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa vai trò này? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(params.row.role_id)}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Xóa
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
  ];

  // ✅ Kiểm tra quyền xem danh sách
  if (!canList) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500 text-lg">Bạn không có quyền truy cập trang này</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="text-blue-500" size={28} />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Danh sách vai trò
            </h1>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                setEditRole(null);
                setAssignRole(null);
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus size={16} className="mr-2" /> Thêm vai trò
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {isError && (
          <div className="text-center py-6">
            <p className="text-red-500 mb-4">Lỗi tải dữ liệu</p>
            <Button onClick={() => refetch()} variant="outline">
              Thử lại
            </Button>
          </div>
        )}

        {!isLoading && !isError && roleList.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">Chưa có vai trò nào</p>
          </div>
        )}

        {!isLoading && !isError && roleList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <DataGrid
              rows={roleList}
              columns={columns}
              getRowId={(row) => row.role_id}
              pageSizeOptions={[5, 10, 25, 50]}
              initialState={{ 
                pagination: { 
                  paginationModel: { pageSize: 10 } 
                } 
              }}
              disableRowSelectionOnClick
              className="!text-gray-700 dark:!text-gray-200"
              autoHeight
            />
          </div>
        )}

        {/* MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditRole(null);
                  setAssignRole(null);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-10"
              >
                <X size={20} />
              </button>

              {assignRole ? (
                <AssignPermissionsForm
                  role={assignRole}
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                    setAssignRole(null);
                  }}
                />
              ) : editRole ? (
                <UpdateRoleForm
                  role={editRole}
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                    setEditRole(null);
                  }}
                />
              ) : (
                <NewRoleForm
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
};

export default RolesPage;