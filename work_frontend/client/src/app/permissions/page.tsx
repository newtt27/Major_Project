// app/permissions/page.tsx
"use client";

import { useState } from "react";
import DashboardWrapper from "@/app/dashboardWrapper";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Shield, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetPermissionsQuery,
  useDeletePermissionMutation,
} from "@/state/api";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import NewPermissionForm from "./new/page";
import UpdatePermissionForm from "./update/page";
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

const PermissionsPage = () => {
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const canCreate = permissions.includes("rbac:permission:create");
  const canUpdate = permissions.includes("rbac:permission:update");
  const canDelete = permissions.includes("rbac:permission:delete");

  const { data: permissionList = [], isLoading, isError, refetch } = useGetPermissionsQuery();
  const [deletePermission] = useDeletePermissionMutation();

  const [showForm, setShowForm] = useState(false);
  const [editPermission, setEditPermission] = useState<any>(null);

  const handleDelete = async (id: number) => {
    try {
      await deletePermission(id).unwrap();
      toast.success("Xóa thành công!");
      refetch();
    } catch {
      toast.error("Xóa thất bại!");
    }
  };

  const columns: GridColDef[] = [
    { field: "permission_id", headerName: "ID", width: 80 },
    { field: "permission_name", headerName: "Tên quyền", flex: 1, minWidth: 200 },
    { field: "category", headerName: "Danh mục", width: 150 },
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
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center justify-center gap-2 h-full">
          {canUpdate && (
            <button
              onClick={() => {
                setEditPermission(params.row);
                setShowForm(true);
              }}
              className="p-2 rounded bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white"
            >
              <Pencil size={16} />
            </button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa quyền này? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(params.row.permission_id)}
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

  return (
    <DashboardWrapper>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Danh sách quyền
            </h1>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                setEditPermission(null);
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus size={16} className="mr-2" /> Thêm quyền
            </Button>
          )}
        </div>

        {isLoading && <p className="text-center py-6">Đang tải...</p>}
        {isError && <p className="text-red-500 text-center py-6">Lỗi tải dữ liệu</p>}

        {!isLoading && permissionList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <DataGrid
              rows={permissionList}
              columns={columns}
              getRowId={(row) => row.permission_id}
              pageSizeOptions={[6]}
              initialState={{ pagination: { paginationModel: { pageSize: 6 } } }}
              disableRowSelectionOnClick
              className="!text-gray-700 dark:!text-gray-200"
            />
          </div>
        )}

        {/* MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>

              {editPermission ? (
                <UpdatePermissionForm
                  permission={editPermission}
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                  }}
                />
              ) : (
                <NewPermissionForm
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

export default PermissionsPage;