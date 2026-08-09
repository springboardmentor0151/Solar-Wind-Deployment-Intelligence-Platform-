import { useEffect, useState } from "react";
import {
  HiOutlineDocumentChartBar,
  HiOutlineArrowDownTray,
  HiOutlineTrash,
} from "react-icons/hi2";

import { getReports, deleteReport } from "../services/reportService";
import { useToast } from "../context/ToastContext";

import DashboardLayout from "../components/layout/DashboardLayout";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function formatDate(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function Reports() {
  const { showToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteReport(deleteTarget.id);
      showToast("Report deleted.");
      setDeleteTarget(null);
      loadReports();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete report.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // PDF export isn't implemented yet — this is an honest placeholder,
  // not a fake download, per the "Reports & Export System" roadmap item.
  const handleDownload = (report) => {
    showToast(
      `PDF export for "${report.projectName || report.siteName}" is coming soon.`,
      "info"
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
        <p className="mt-3 text-slate-600">
          View and manage generated project and site analysis reports.
        </p>

        {loading && <Loader label="Loading reports..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={loadReports} />
        )}

        {!loading && !error && reports.length === 0 && (
          <EmptyState
            icon={HiOutlineDocumentChartBar}
            title="No Reports Yet"
            message={`Generate a report from a project's "Generate Report" button, or save a site analysis, to see it here.`}
          />
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      report.type === "site-analysis"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {report.type === "site-analysis"
                      ? "Site Analysis"
                      : "Project Summary"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(report.createdAt)}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900 truncate">
                  {report.projectName || "Untitled Project"}
                </h2>

                {report.siteName && (
                  <p className="text-sm text-slate-500 mt-1">
                    Site: {report.siteName}
                  </p>
                )}

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  {report.energyType && (
                    <p>
                      <span className="text-slate-400">Type:</span>{" "}
                      {report.energyType}
                    </p>
                  )}
                  {report.region && (
                    <p>
                      <span className="text-slate-400">Region:</span>{" "}
                      {report.region}
                    </p>
                  )}
                  {typeof report.siteCount === "number" && (
                    <p>
                      <span className="text-slate-400">Sites:</span>{" "}
                      {report.siteCount}
                    </p>
                  )}
                  {report.latitude && (
                    <p>
                      <span className="text-slate-400">Coordinates:</span>{" "}
                      {report.latitude}, {report.longitude}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleDownload(report)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white py-2.5 rounded-xl transition-all duration-300 font-medium"
                  >
                    <HiOutlineArrowDownTray />
                    Download
                  </button>

                  <button
                    onClick={() => setDeleteTarget(report)}
                    className="flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Roadmap card — unchanged from original */}
        <div className="mt-10 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold">📄 Report Module</h2>
          <p className="mt-4 text-slate-600">Future reports will include:</p>
          <ul className="mt-5 list-disc pl-6 space-y-2 text-slate-700">
            <li>Solar Suitability Score</li>
            <li>Wind Suitability Score</li>
            <li>Environmental Analysis</li>
            <li>Terrain Analysis</li>
            <li>AI Recommendations</li>
            <li>Full PDF Export</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this report?"
        message="This report will be permanently removed."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
