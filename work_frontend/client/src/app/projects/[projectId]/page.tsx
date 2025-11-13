"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, FolderOpen, Plus, Pencil, List } from "lucide-react";
import DashboardWrapper from "../../dashboardWrapper";
import NewPartForm from "./parts/new/page";
import EditPartForm from "./parts/[partId]/update/page";
import { useGetProjectByIdQuery, useGetProjectPartsQuery } from "@/state/api";

const ProjectDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? Number(params.projectId[0])
    : Number(params.projectId);

  const [showNewPartForm, setShowNewPartForm] = useState(false);
  const [editPartId, setEditPartId] = useState<number | null>(null);

  // === Fetch project info ===
  const {
    data: project,
    isLoading: isLoadingProject,
    isError: isErrorProject,
  } = useGetProjectByIdQuery(projectId);

  // === Fetch project parts ===
  const {
    data: projectParts,
    isLoading: isLoadingParts,
    isError: isErrorParts,
    refetch: refetchParts,
  } = useGetProjectPartsQuery(projectId);

  const filteredParts =
    projectParts?.data?.filter((p) => p.project_id === projectId) || [];

  const selectedPart = editPartId
    ? filteredParts.find((p) => p.part_id === editPartId) || null
    : null;

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

  // === Loading & error states ===
  if (isLoadingProject || isLoadingParts)
    return <DashboardWrapper>Loading...</DashboardWrapper>;
  if (isErrorProject || isErrorParts)
    return <DashboardWrapper>Error loading data</DashboardWrapper>;
  if (!project) return <DashboardWrapper>Project not found</DashboardWrapper>;

  return (
    <DashboardWrapper>
      <div className="w-full relative">
        {/* Back button */}
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 mb-6"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>

        {/* Project info */}
        <h1 className="text-2xl font-bold mb-2">{project.data.project_name}</h1>
        {project.data.description && (
          <p className="text-gray-600 mb-2">{project.data.description}</p>
        )}
        <p className="text-sm text-gray-500 mb-4">
          Ngày tạo:{" "}
          {project.data.created_at
            ? new Date(project.data.created_at).toLocaleDateString()
            : "-"}
        </p>

        {/* Header actions */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen /> Các phần trong dự án
          </h2>
          <button
            onClick={() => {
              setEditPartId(null);
              setShowNewPartForm(true);
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600"
          >
            <Plus size={18} /> Thêm phần dự án mới
          </button>
        </div>

        {/* Parts list */}
        {filteredParts.length === 0 ? (
          <p>Chưa có phần nào trong project này.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredParts.map((part) => (
              <div
                key={part.part_id}
                className="relative p-5 rounded-2xl shadow-md bg-white dark:bg-gray-800 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold mb-2">{part.part_name}</h3>
                {part.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {part.description}
                  </p>
                )}
                <p
                  className={`text-sm font-medium ${getStatusColor(
                    part.status
                  )}`}
                >
                  {part.status}
                </p>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/parts/${part.part_id}/tasks`
                      )
                    }
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                  >
                    <List size={16} /> Xem tasks
                  </button>

                  <button
                    onClick={() => setEditPartId(part.part_id)}
                    className="text-gray-500 hover:text-blue-500 transition"
                    title="Chỉnh sửa phần này"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {(showNewPartForm || (editPartId && selectedPart)) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-[90%] max-w-lg p-6">
              <button
                onClick={() => {
                  setShowNewPartForm(false);
                  setEditPartId(null);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              {editPartId && selectedPart ? (
                <EditPartForm
                  part={selectedPart}
                  onSuccess={() => {
                    setEditPartId(null);
                    refetchParts();
                  }}
                  onClose={() => setEditPartId(null)}
                />
              ) : (
                <NewPartForm
                  projectId={projectId}
                  onSuccess={() => {
                    setShowNewPartForm(false);
                    refetchParts();
                  }}
                  onClose={() => setShowNewPartForm(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
};

export default ProjectDetailPage;
