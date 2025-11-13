"use client";

import { useState } from "react";
import { CheckCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardWrapper from "../dashboardWrapper";
import { useGetProjectsQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store";
import NewProjectForm from "./new/page"; // form tạo dự án mới
import UpdateProjectForm from "./update/page";
import { Pencil } from "lucide-react";
// ===== TYPE =====
interface Project {
  project_id: number;
  project_name: string;
  description?: string;
  status: string;
  created_by_name?: string;
  created_at?: string;
}

const ProjectsPage = () => {
  const router = useRouter();

  // ===== PERMISSIONS =====
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const canCreate = permissions.includes("project:create");

  // ===== API =====
  const { data, isLoading, isError, refetch } = useGetProjectsQuery();

  // Dữ liệu backend trả về có thể là { data: Project[] } hoặc mảng trực tiếp
  const projectsArray: Project[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  console.log("Projects fetched:", projectsArray);

  // ===== STATE =====
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // ===== UTILS =====
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-500";
      case "Planning":
        return "text-yellow-500";
      case "Completed":
        return "text-blue-500";
      case "Inactive":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  // ===== RENDER =====
  return (
    <DashboardWrapper>
      <div className="w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold mb-6">Dự án</h1>
          {canCreate && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <Plus size={16} /> Tạo dự án mới
            </Button>
          )}
        </div>

        {/* API Status */}
        {isLoading && (
          <div className="text-gray-500 mb-4">Đang tải dự án...</div>
        )}
        {isError && (
          <div className="text-red-500 mb-4">
            Lỗi tải danh sách dự án. Vui lòng thử lại.
          </div>
        )}
        {!isLoading && !isError && projectsArray.length === 0 && (
          <div className="text-gray-500 mb-4">Không có dự án nào.</div>
        )}

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-4">
          {projectsArray.map((project, index) => (
            <div
              key={project.project_id ?? index}
              onClick={() => router.push(`/projects/${project.project_id}`)}
              className="cursor-pointer p-5 rounded-2xl shadow-md bg-white dark:bg-gray-800 hover:shadow-lg hover:scale-[1.02] transition-transform"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation(); // ⛔ Ngăn không cho click lan lên card
                  setEditingProject(project);
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-blue-600"
              >
                <Pencil size={18} />
              </button>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                {project.project_name}
              </h2>

              {project.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {project.description}
                </p>
              )}

              <p
                className={`text-sm font-medium flex items-center gap-1 ${getStatusColor(
                  project.status
                )}`}
              >
                <CheckCircle size={16} /> {project.status}
              </p>
            </div>
          ))}
        </div>

        {/* Modal Tạo Project */}
        {showForm && (
          <NewProjectForm
            onSuccess={() => {
              refetch(); // reload danh sách project
              setShowForm(false); // đóng modal
            }}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Modal Cập nhật Project */}
        {editingProject && (
          <UpdateProjectForm
            project={editingProject}
            onSuccess={() => {
              refetch();
              setEditingProject(null);
            }}
            onClose={() => setEditingProject(null)}
          />
        )}
      </div>
    </DashboardWrapper>
  );
};

export default ProjectsPage;
