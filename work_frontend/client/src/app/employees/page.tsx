"use client";

import { useState } from "react";
import DashboardWrapper from "../dashboardWrapper";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Users as UserIcon, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import NewEmployeeForm from "./new/page";
import UpdateEmployeeForm from "./update/page";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useGetDepartmentByIdQuery,
  User,
} from "@/state/api";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

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

const UsersPage = () => {
  // ====== PERMISSIONS ======
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const canCreate = permissions.includes("user:create");
  const canUpdate = permissions.includes("user:update");
  const canDelete = permissions.includes("user:delete");

  // ====== API USERS ======
  const { data: usersData, isLoading, isError, refetch } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();

  // ====== STATE ======
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // ====== HANDLE DELETE ======
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id).unwrap();
      toast.success("Đã xóa người dùng thành công!");
      refetch();
    } catch (error) {
      toast.error("Xóa người dùng thất bại!");
    }
  };

  // ====== COLUMNS ======
  const columns: GridColDef<User>[] = [
    { field: "user_id", headerName: "ID", width: 70 },
    {
      field: "name",
      headerName: "Tên",
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<User>) =>
        `${params.row.first_name} ${params.row.last_name}`,
    },
    {
      field: "phone",
      headerName: "Số điện thoại",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "position",
      headerName: "Chức vụ",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 120,
      renderCell: (params: GridRenderCellParams<User>) => (
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium ${
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
      field: "department",
      headerName: "Phòng ban",
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<User>) => {
        const deptId = params.row.department_id;
        const { data: deptData } = useGetDepartmentByIdQuery(deptId!, {
          skip: !deptId,
        });

        return deptData?.data?.department_name || "Chưa có";
      },
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<User>) => (
        <div className="flex items-center justify-center gap-2 w-full h-full">
          {canUpdate && (
            <button
              onClick={() => {
                setEditUser(params.row);
                setShowForm(true);
              }}
              className="p-2 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-colors duration-200"
              title="Sửa người dùng"
            >
              <Pencil size={16} />
            </button>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-colors duration-200"
                  title="Xóa người dùng"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa người dùng này? Hành động này không thể
                    hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(params.row.user_id)}
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
      <div className="flex flex-col gap-6 w-full px-6 sm:px-8 mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserIcon className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Danh sách người dùng
            </h1>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                setEditUser(null);
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus size={16} className="mr-2" /> Thêm người dùng
            </Button>
          )}
        </div>

        {/* Trạng thái tải */}
        {isLoading && (
          <p className="text-gray-500 text-center py-6">Đang tải dữ liệu...</p>
        )}
        {isError && (
          <p className="text-red-500 text-center py-6">
            Lỗi khi tải danh sách người dùng
          </p>
        )}

        {/* DataGrid */}
        {!isLoading && usersData && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="!text-gray-700 dark:!text-gray-200">
              <DataGrid
                rows={usersData?.data ?? []}
                columns={columns}
                getRowId={(row) => row.user_id}
                pageSizeOptions={[5, 10]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5, page: 0 } },
                }}
                disableRowSelectionOnClick
                autoHeight
                density="standard"
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    py: 1,
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    bgColor: "transparent",
                    borderBottom: "1px solid",
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid",
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>

              {editUser ? (
                <UpdateEmployeeForm
                  employee={editUser}
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                  }}
                />
              ) : (
                <NewEmployeeForm
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

export default UsersPage;
