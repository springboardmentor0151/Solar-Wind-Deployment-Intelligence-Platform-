import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiFileText, FiSearch } from "react-icons/fi";

import { downloadReport, getProjects, getReportDetail, getReports } from "../api/projects.js";

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(2);
  return value;
};

function ReportSection({ title, rows }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-semibold">{title}</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(rows || {}).map(([key, value]) => (
          <div key={key} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</dt>
            <dd className="mt-1 font-semibold">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [detail, setDetail] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getReports(), getProjects()])
      .then(([reportData, projectData]) => {
        setReports(reportData);
        setProjects(projectData);
        setSelectedProjectId(projectData[0]?.id || "");
      })
      .catch(() => {
        setError("Unable to load reports. Please try again.");
        setReports([]);
        setProjects([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setDetail(null);
      return;
    }
    getReportDetail(selectedProjectId)
      .then(setDetail)
      .catch(() => {
        setError("Unable to load report details.");
        setDetail(null);
      });
  }, [selectedProjectId]);

  const filtered = useMemo(() => reports.filter((report) => {
    const matchesQuery = `${report.project_name} ${report.report_type}`.toLowerCase().includes(query.toLowerCase());
    const matchesType = type === "All" || report.report_type === type;
    return matchesQuery && matchesType;
  }), [reports, query, type]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-canopy-700">Reports</p>
        <h2 className="mt-2 text-3xl font-bold">Project Assessment Reports</h2>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500">Total Reports</p><p className="mt-2 text-3xl font-bold">{reports.length}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500">Saved Projects</p><p className="mt-2 text-3xl font-bold">{projects.length}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500">Average Capacity</p><p className="mt-2 text-3xl font-bold">{projects.length ? Math.round(projects.reduce((sum, project) => sum + project.capacity_mw, 0) / projects.length) : 0} MW</p></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-64 flex-1"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 dark:border-slate-700 dark:bg-slate-950" placeholder="Search reports" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select className="rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option>Project Summary</option></select>
          <select className="rounded-lg border border-slate-300 px-3 py-3 dark:border-slate-700 dark:bg-slate-950" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-slate-500"><tr><th className="py-3">Project</th><th>Report</th><th>Created</th><th>Download</th></tr></thead>
            <tbody>{filtered.map((report) => (
              <tr key={report.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-3 font-semibold">{report.project_name}</td>
                <td>{report.report_type}</td>
                <td>{new Date(report.created_at).toLocaleString()}</td>
                <td><div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-white dark:bg-white dark:text-slate-950" onClick={() => downloadReport(report.project_id, "pdf")}><FiDownload /> PDF</button><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700" onClick={() => downloadReport(report.project_id, "excel")}><FiDownload /> Excel</button></div></td>
              </tr>
            ))}</tbody>
          </table>
          {!filtered.length && <p className="py-8 text-center text-sm text-slate-500">No reports found.</p>}
        </div>
      </section>

      {detail ? (
        <div className="space-y-4">
          <section className="rounded-lg border border-canopy-200 bg-canopy-50 p-5 text-canopy-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><FiFileText className="h-6 w-6" /><div><p className="text-sm font-semibold">Final Recommendation</p><p className="text-2xl font-bold">{detail.final_recommendation}</p></div></div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-canopy-700 px-4 py-2 font-semibold text-white" onClick={() => downloadReport(detail.project_information.id, "pdf")}><FiDownload /> Export PDF</button>
            </div>
          </section>
          <ReportSection title="Project Information" rows={detail.project_information} />
          <ReportSection title="Environmental Assessment" rows={detail.environmental_assessment} />
          <ReportSection title="Renewable Assessment" rows={detail.renewable_assessment} />
          <ReportSection title="Deployment Recommendation" rows={detail.deployment_recommendation} />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-slate-700">No projects available.</p>
      )}
    </div>
  );
}
