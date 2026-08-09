import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlusCircle,
  HiOutlineMapPin,
  HiOutlineDocumentChartBar,
} from "react-icons/hi2";

import { getProject, deleteProject } from "../services/projectService";
import { getSites, deleteSite } from "../services/siteService";
import { createReport } from "../services/reportService";
import { useAuth } from "../Authentication/AuthContext";
import { useToast } from "../context/ToastContext";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EditProjectModal from "../components/EditProjectModal";
import SiteFormModal from "../components/SiteFormModal";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteBeingEdited, setSiteBeingEdited] = useState(null);
  const [siteDeleteTarget, setSiteDeleteTarget] = useState(null);
  const [deletingSite, setDeletingSite] = useState(false);

  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectData, sitesData] = await Promise.all([
        getProject(id),
        getSites(id),
      ]);

      setProject(projectData);
      setSites(sitesData);
    } catch (err) {
      console.error(err);
      setError("Couldn't load this project. It may have been deleted.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeletingProject(true);
      await deleteProject(id);
      showToast("Project deleted successfully.");
      navigate("/projects");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete project.", "error");
      setDeletingProject(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteDeleteTarget) return;

    try {
      setDeletingSite(true);
      await deleteSite(siteDeleteTarget.id);
      showToast("Site deleted successfully.");
      setSiteDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete site.", "error");
    } finally {
      setDeletingSite(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);

      await createReport({
        type: "summary",
        projectId: project.id,
        projectName: project.projectName,
        energyType: project.energyType,
        region: project.region,
        siteCount: sites.length,
        generatedBy: currentUser?.email || "Unknown",
      });

      showToast("Report generated successfully.");
      navigate("/reports");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate report.", "error");
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <button
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
        >
          <HiOutlineArrowLeft />
          Back to Projects
        </button>

        {loading && <Loader label="Loading project..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={loadData} />
        )}

        {!loading && !error && project && (
          <>
            {/* Project Header */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-slate-900">
                      {project.projectName}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
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

                  <p className="mt-3 text-slate-500">
                    {project.energyType} · {project.region}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Created by {project.createdBy} on{" "}
                    {project.createdAt?.toDate
                      ? project.createdAt.toDate().toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditProjectOpen(true)}
                    className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl transition-all duration-300 font-medium"
                  >
                    <HiOutlinePencilSquare />
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteProjectOpen(true)}
                    className="inline-flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 px-5 py-3 rounded-xl transition-all duration-300 font-medium"
                  >
                    <HiOutlineTrash />
                    Delete
                  </button>

                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl shadow-lg transition-all duration-300 font-medium disabled:opacity-60"
                  >
                    <HiOutlineDocumentChartBar />
                    {generatingReport ? "Generating..." : "Generate Report"}
                  </button>
                </div>
              </div>
            </div>

            {/* Sites */}
            <div className="mt-8">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Project Sites
                </h2>

                <button
                  onClick={() => {
                    setSiteBeingEdited(null);
                    setSiteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 font-medium"
                >
                  <HiOutlinePlusCircle />
                  Add Site
                </button>
              </div>

              {sites.length === 0 ? (
                <EmptyState
                  icon={HiOutlineMapPin}
                  title="No Sites Yet"
                  message="Add a site to this project to begin tracking its location and analysis data."
                  actionLabel="Add Site"
                  onAction={() => {
                    setSiteBeingEdited(null);
                    setSiteModalOpen(true);
                  }}
                />
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {site.siteName}
                        </h3>
                        <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {site.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location</span>
                          <span className="font-medium text-slate-900">
                            {site.district}, {site.state}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Coordinates</span>
                          <span className="font-medium text-slate-900">
                            {site.latitude}, {site.longitude}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Elevation</span>
                          <span className="font-medium text-slate-900">
                            {site.elevation ?? "—"} m
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => {
                            setSiteBeingEdited(site);
                            setSiteModalOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl transition-all duration-300 font-medium"
                        >
                          <HiOutlinePencilSquare />
                          Edit
                        </button>

                        <button
                          onClick={() => setSiteDeleteTarget(site)}
                          className="flex-1 flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 py-2.5 rounded-xl transition-all duration-300 font-medium"
                        >
                          <HiOutlineTrash />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <EditProjectModal
        open={editProjectOpen}
        project={project}
        onClose={() => setEditProjectOpen(false)}
        onSaved={loadData}
      />

      <SiteFormModal
        open={siteModalOpen}
        projectId={id}
        site={siteBeingEdited}
        onClose={() => setSiteModalOpen(false)}
        onSaved={loadData}
      />

      <ConfirmDialog
        open={deleteProjectOpen}
        title="Delete this project?"
        message="All associated data will remain unless sites are removed separately. This cannot be undone."
        loading={deletingProject}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(siteDeleteTarget)}
        title="Delete this site?"
        message={`"${siteDeleteTarget?.siteName}" will be permanently removed.`}
        loading={deletingSite}
        onConfirm={handleDeleteSite}
        onCancel={() => setSiteDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
