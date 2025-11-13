"use client";

import { useState } from "react";
import DashboardWrapper from "../dashboardWrapper";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { User as AccountIcon, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import {
  useGetAccountsQuery,
  useDeleteAccountMutation,
  Account,
} from "@/state/api";
import NewAccountForm from "./new/page";
import UpdateAccountForm from "./update/page";
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

const AccountsPage = () => {
  // ====== PERMISSIONS ======
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const canCreate = permissions.includes("account:create");
  const canUpdate = permissions.includes("account:update");
  const canDelete = permissions.includes("account:delete");

  // ====== API HOOKS ======
  const {
    data: accounts,
    isLoading,
    isError,
    refetch,
  } = useGetAccountsQuery();
  const [deleteAccount] = useDeleteAccountMutation();

  // ====== STATE ======
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // ====== HANDLE DELETE ======
  const handleDelete = async (id: number) => {
    try {
      await deleteAccount(id).unwrap();
      toast.success("✅ Đã xóa tài khoản thành công!");
      refetch();
    } catch (error: any) {
      console.error("❌ Lỗi khi xóa tài khoản:", error);
      toast.error(error?.data?.message || "Xóa tài khoản thất bại!");
    }
  };

  // ====== CUSTOM RENDERERS ======
  const renderUserInfo = (params: GridRenderCellParams<Account>) => {
    const { user } = params.row;
    
    // Kiểm tra kỹ hơn - nếu không có user object hoặc user_id là null
    if (!user || user.user_id === null || user.user_id === undefined) {
      return (
        <span className="text-gray-400 italic">-----</span>
      );
    }
    
    // Kiểm tra nếu thiếu thông tin tên
    if (!user.first_name && !user.last_name) {
      return (
        <span className="text-gray-400 italic">-----</span>
      );
    }
    
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  };

  const renderRoleInfo = (params: GridRenderCellParams<Account>) => {
    if (!params.row.role || !params.row.role.role_name) {
      return (
        <span className="text-gray-400 italic">-----</span>
      );
    }
    return params.row.role.role_name;
  };

  // ====== COLUMNS ======
  const columns: GridColDef<Account>[] = [
    { field: "account_id", headerName: "ID", width: 70 },
    {
      field: "email",
      headerName: "Email",
      flex: 1.2,
      minWidth: 220,
    },
    {
      field: "user",
      headerName: "Người dùng",
      flex: 1,
      minWidth: 180,
      renderCell: renderUserInfo,
    },
    {
      field: "role",
      headerName: "Vai trò",
      flex: 1,
      minWidth: 150,
      renderCell: renderRoleInfo,
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 120,
      renderCell: (params: GridRenderCellParams<Account>) => (
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium ${
            params.value === "Active"
              ? "bg-green-100 text-green-700"
              : params.value === "Inactive"
              ? "bg-gray-200 text-gray-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {params.value || "Unknown"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Account>) => (
        <div className="flex items-center justify-center gap-2 w-full h-full">
          {canUpdate && (
            <button
              onClick={() => {
                setEditAccount(params.row);
                setShowForm(true);
              }}
              className="p-2 rounded-md bg-yellow-100 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-colors duration-200"
              title="Sửa tài khoản"
            >
              <Pencil size={16} />
            </button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-colors duration-200"
                  title="Xóa tài khoản"
                >
                  <Trash2 size={16} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa tài khoản này? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(params.row.account_id)}
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

  // ====== UI ======
  return (
    <DashboardWrapper>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AccountIcon className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Danh sách tài khoản
            </h1>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                setEditAccount(null);
                setShowForm(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus size={16} className="mr-2" /> Thêm tài khoản
            </Button>
          )}
        </div>

        {/* Trạng thái tải */}
        {isLoading && (
          <p className="text-gray-500 text-center py-6">Đang tải dữ liệu...</p>
        )}
        {isError && (
          <p className="text-red-500 text-center py-6">
            Lỗi khi tải danh sách tài khoản
          </p>
        )}

        {/* DataGrid */}
        {!isLoading && accounts && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <DataGrid
              rows={accounts.data}
              columns={columns}
              getRowId={(row) => row.account_id}
              pageSizeOptions={[5, 10]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5, page: 0 } },
              }}
              disableRowSelectionOnClick
              className="!text-gray-700 dark:!text-gray-200"
            />
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

              {editAccount ? (
                <UpdateAccountForm
                  account={editAccount}
                  onSuccess={() => {
                    refetch();
                    setShowForm(false);
                  }}
                />
              ) : (
                <NewAccountForm
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

export default AccountsPage;