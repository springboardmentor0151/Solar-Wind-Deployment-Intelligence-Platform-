import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_BASE } from "../api/client";
import AnalysisPanel from "../components/AnalysisPanel";
import { useSites } from "../context/SitesContext";
import { RefreshCw, Trash2, FileDown, FileSpreadsheet } from "lucide-react";

const STATUS_LABEL = {
  prospecting: "Prospecting",
  feasibility_study: "Feasibility Study",
  approved: "Approved",
  in_construction: "In Construction",
  operational: "Operational",
  on_hold: "On Hold",
};

export default function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useSites();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/sites/${siteId}/analysis`);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load this site.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [siteId]);

  async function updateStatus(newStatus) {
    setBusy(true);
    try {
      const res = await api.patch(`/sites/${siteId}`, { status: newStatus });
      setData((d) => ({ ...d, site: res.data }));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function reanalyze() {
    setBusy(true);
    try {
      const res = await api.post(`/sites/${siteId}/reanalyze`);
      setData(res.data);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this site from your portfolio? This can't be undone.")) return;
    await api.delete(`/sites/${siteId}`);
    await refresh();
    navigate("/sites");
  }

  function download(kind) {
    const token = localStorage.getItem("renewsite_token");
    fetch(`${API_BASE}/reports/${siteId}/${kind}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report.${kind === "excel" ? "xlsx" : "pdf"}`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  if (loading) return <div className="p-8 text-sm text-ink/40">Loading site intelligence…</div>;
  if (error) return <div className="p-8 text-sm text-rust">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="label-eyebrow mb-1">{data.site.project_id}</p>
          <h1 className="font-display text-2xl font-semibold">{data.site.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={data.site.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={busy}
            className="text-xs rounded-lg border border-line bg-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-moss-400"
          >
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button onClick={reanalyze} disabled={busy} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Re-analyze
          </button>
          <button onClick={() => download("pdf")} className="btn-secondary flex items-center gap-1.5">
            <FileDown size={14} /> PDF
          </button>
          <button onClick={() => download("excel")} className="btn-secondary flex items-center gap-1.5">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={remove} className="btn-secondary flex items-center gap-1.5 text-rust hover:border-rust">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnalysisPanel analysis={data.analysis} siteName={data.site.name} />
    </div>
  );
}
