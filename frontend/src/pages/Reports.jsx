import { Link } from "react-router-dom";
import { useSites } from "../context/SitesContext";
import { API_BASE } from "../api/client";
import { FileDown, FileSpreadsheet } from "lucide-react";

export default function Reports() {
  const { sites } = useSites();

  function download(siteId, kind) {
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

  return (
    <div className="p-8 max-w-4xl">
      <p className="label-eyebrow mb-1">Reports &amp; Export</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Site assessment reports</h1>
      <p className="text-ink/55 mb-8">
        Generate a full PDF site-assessment report or an Excel workbook with monthly generation
        data, suitability sub-scores, and investment forecasts for any registered site.
      </p>

      {sites.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink/50 mb-4">Register a site first to generate reports.</p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {sites.map((s) => (
            <div key={s.site.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium">{s.site.name}</p>
                <p className="text-xs font-mono text-ink/40">{s.site.project_id} · {s.category || "Not analyzed"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => download(s.site.id, "pdf")} className="btn-secondary flex items-center gap-1.5">
                  <FileDown size={14} /> PDF
                </button>
                <button onClick={() => download(s.site.id, "excel")} className="btn-secondary flex items-center gap-1.5">
                  <FileSpreadsheet size={14} /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
