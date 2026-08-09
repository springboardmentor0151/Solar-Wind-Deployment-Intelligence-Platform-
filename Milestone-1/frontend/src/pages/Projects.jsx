import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlinePlusCircle,
  HiOutlineFolderOpen,
  HiOutlineMapPin,
  HiOutlineBolt,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

import { getProjects, deleteProject } from "../services/projectService";
import { useToast } from "../context/ToastContext";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EditProjectModal from "../components/EditProjectModal";

export default function Projects() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError("Couldn't load your projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteProject(deleteTarget.id);
      showToast("Project deleted successfully.");
      setDeleteTarget(null);
      loadProjects();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete project.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalProjects = projects.length;
  const solarProjects = projects.filter((p) => p.energyType === "Solar").length;
  const windProjects = projects.filter((p) => p.energyType === "Wind").length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Projects</h1>
            <p className="mt-2 text-slate-600">
              Manage all your renewable energy deployment projects.
            </p>
          </div>

          <button
            onClick={() => navigate("/create-project")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
          >
            <HiOutlinePlusCircle className="text-xl" />
            Create Project
          </button>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <HiOutlineFolderOpen className="text-4xl text-blue-600 mb-4" />
            <h2 className="text-3xl font-bold">{totalProjects}</h2>
            <p className="text-slate-500 mt-2">Total Projects</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <HiOutlineBolt className="text-4xl text-green-600 mb-4" />
            <h2 className="text-3xl font-bold">{solarProjects}</h2>
            <p className="text-slate-500 mt-2">Solar Projects</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <HiOutlineMapPin className="text-4xl text-cyan-600 mb-4" />
            <h2 className="text-3xl font-bold">{windProjects}</h2>
            <p className="text-slate-500 mt-2">Wind Projects</p>
          </div>
        </div>

        {loading && <Loader label="Loading projects..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={loadProjects} />
        )}

        {!loading && !error && projects.length === 0 && (
          <EmptyState
            icon={HiOutlineFolderOpen}
            title="No Projects Found"
            message='Click "Create Project" to create your first renewable energy project.'
            actionLabel="Create Project"
            onAction={() => navigate("/create-project")}
          />
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-900 truncate">
                      {project.projectName}
                    </h2>

                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : project.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Energy Type</span>
                    <span className="font-semibold text-slate-900">
                      {project.energyType}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Region</span>
                    <span className="font-semibold text-slate-900">
                      {project.region}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Created By</span>
                    <span className="font-semibold text-slate-900 text-right break-all">
                      {project.createdBy}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Created On</span>
                    <span className="font-semibold text-slate-900">
                      {project.createdAt?.toDate
                        ? project.createdAt.toDate().toLocaleDateString()
                        : "Today"}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6 space-y-3">
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white py-3 rounded-xl transition-all duration-300 font-semibold"
                  >
                    View Details
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditTarget(project)}
                      className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl transition-all duration-300 font-medium"
                    >
                      <HiOutlinePencilSquare />
                      Edit
                    </button>

                    <button
                      onClick={() => setDeleteTarget(project)}
                      className="flex-1 flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 py-2.5 rounded-xl transition-all duration-300 font-medium"
                    >
                      <HiOutlineTrash />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Total Projects :{" "}
            <span className="font-semibold text-slate-800">
              {totalProjects}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            Solar & Wind Deployment Intelligence Platform
          </p>
        </div>
      </div>

      <EditProjectModal
        open={Boolean(editTarget)}
        project={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={loadProjects}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this project?"
        message={`"${deleteTarget?.projectName}" will be permanently removed. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
