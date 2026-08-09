import { Link } from "react-router-dom";
import { useSites } from "../context/SitesContext";
import { MapPin } from "lucide-react";

const CATEGORY_DOT = {
  Excellent: "bg-moss-700",
  "Highly Suitable": "bg-moss-500",
  "Moderately Suitable": "bg-sun",
  "Low Suitability": "bg-clay",
  Unsuitable: "bg-rust",
};

const STATUS_LABEL = {
  prospecting: "Prospecting",
  feasibility_study: "Feasibility Study",
  approved: "Approved",
  in_construction: "In Construction",
  operational: "Operational",
  on_hold: "On Hold",
};

const STATUS_COLOR = {
  prospecting: "bg-ink/10 text-ink/60",
  feasibility_study: "bg-sky/10 text-sky",
  approved: "bg-moss-100 text-moss-700",
  in_construction: "bg-amber-50 text-sun",
  operational: "bg-moss-700 text-white",
  on_hold: "bg-red-50 text-rust",
};

export default function SiteList() {
  const { sites, loading } = useSites();

  return (
    <div className="p-8 max-w-5xl">
      <p className="label-eyebrow mb-1">Site Intelligence</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Your registered sites</h1>
      <p className="text-ink/55 mb-8">Open any site for the full environmental, resource, and investment breakdown.</p>

      {loading ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : sites.length === 0 ? (
        <div className="card p-10 text-center">
          <MapPin className="mx-auto mb-3 text-moss-500" size={28} />
          <h2 className="font-display text-lg font-semibold mb-1">Nothing registered yet</h2>
          <p className="text-sm text-ink/50 mb-5">Head to Explore Sites to analyze and register a location.</p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sites.map((s) => (
            <Link
              to={`/sites/${s.site.id}`}
              key={s.site.id}
              className="card p-5 hover:border-moss-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{s.site.name}</p>
                  <p className="text-xs font-mono text-ink/40">{s.site.project_id}</p>
                </div>
                {s.category && <span className={`w-2.5 h-2.5 rounded-full mt-1 ${CATEGORY_DOT[s.category]}`} />}
              </div>
              <p className="text-xs text-ink/50 font-mono mb-3">
                {s.site.latitude.toFixed(4)}, {s.site.longitude.toFixed(4)}
              </p>
              {s.site.status && (
                <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full mb-3 ${STATUS_COLOR[s.site.status] || ""}`}>
                  {STATUS_LABEL[s.site.status] || s.site.status}
                </span>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="text-xs text-ink/50">{s.category || "Not yet analyzed"}</span>
                {s.overall_score !== null && (
                  <span className="font-mono font-semibold text-moss-700">{s.overall_score}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
