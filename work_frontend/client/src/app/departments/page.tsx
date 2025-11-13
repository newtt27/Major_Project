"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardWrapper from "../dashboardWrapper";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Building2, Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  useGetDepartmentsQuery,
  useDeleteDepartmentMutation,
  Department,
} from "@/state/api";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";

import NewDepartmentForm from "./new/page";
import UpdateDepartmentForm from "./update/page";

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

const DepartmentPage = () => {
  const router = useRouter();

  // ====== PERMISSIONS ======
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const canCreate = permissions.includes("department:create");
  const canUpdate = permissions.includes("department:update");
  const canDelete = permissions.includes("department:delete");
  const canView = permissions.includes("department:read");

  // ====== API CALLS ======
  const {
    data: deptData,
    isLoading,
    isError,
    refetch,
  } = useGetDepartmentsQuery();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  // ====== STATE ======
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  // ====== HANDLE DELETE ======
  const handleDelete = async (id: number) => {
    try {
      await deleteDepartment(id).unwrap();
      toast.success("Đã xóa phòng ban thành công!");
      refetch();
    } catch (error) {
      toast.error("Xóa phòng ban thất bại!");
    }
  };

  // ====== COLUMNS ======
  const columns: GridColDef<Department>[] = [
    { field: "department_id", headerName: "ID", width: 80 },
    {
      field: "department_name",
      headerName: "Tên phòng ban",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "description",
      headerName: "Mô tả",
      flex: 1.5,
      minWidth: 250,
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 130,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            params.value === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 160,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Department>) => (
        <div className="flex items-center justify-center gap-2 w-full h-full">
          {/* ✏️ Sửa */}
          {canUpdate && (
            <button
              onClick={() => {
                setEditDept(params.row);
                setShowForm(true);
              }}
              className="p-2 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-colors duration-200"
              title="Sửa phòng ban"
            >
              <Pencil size={16} />
            </button>
          )}

          {/* 👁️ Xem chi tiết */}
          {canView && (
            <button
              onClick={() =>
                router.push(`/departments/${params.row.department_id}`)
              }
              className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors duration-200"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
          )}

          {/* 🗑️ Xóa */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-colors duration-200"
                  title="Xóa phòng ban"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa phòng ban này? Hành động này không thể
                    hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(params.row.department_id)}
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
            <Building2 className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Danh sách phòng ban
            </h1>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                setEditDept(null);
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus size={16} className="mr-2" /> Thêm phòng ban
            </Button>
          )}
        </div>

        {/* Trạng thái tải */}
        {isLoading && (
          <p className="text-gray-500 text-center py-6">Đang tải dữ liệu...</p>
        )}
        {isError && (
          <p className="text-red-500 text-center py-6">
            Lỗi khi tải danh sách phòng ban
          </p>
        )}

        {/* DataGrid */}
        {!isLoading && deptData && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="!text-gray-700 dark:!text-gray-200">
              <DataGrid
                rows={deptData?.data ?? []}
                columns={columns}
                getRowId={(row) => row.department_id}
                pageSizeOptions={[5, 10]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5, page: 0 } },
                }}
                disableRowSelectionOnClick
                autoHeight
                density="standard"
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": { py: 1 },
                  "& .MuiDataGrid-columnHeaders": {
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

              {editDept ? (
                <UpdateDepartmentForm
                  department={editDept}
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                  }}
                />
              ) : (
                <NewDepartmentForm
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

export default DepartmentPage;
