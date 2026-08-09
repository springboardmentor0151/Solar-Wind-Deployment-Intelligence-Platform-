import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend,
} from "recharts";
import api from "../api/client";
import { useSites } from "../context/SitesContext";

const COLORS = ["#166534", "#3a7ca5", "#c9702f", "#8ad395", "#c04a3d", "#e0a52c"];
const CATEGORY_BADGE = {
  Excellent: "bg-moss-100 text-moss-800",
  "Highly Suitable": "bg-moss-50 text-moss-600",
  "Moderately Suitable": "bg-amber-50 text-sun",
  "Low Suitability": "bg-orange-50 text-clay",
  Unsuitable: "bg-red-50 text-rust",
};

export default function Compare() {
  const { sites, selectedSiteIds, toggleSelected } = useSites();
  const [rows, setRows] = useState([]);
  const [sortKey, setSortKey] = useState("overall_score");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(false);

  async function runCompare() {
    if (selectedSiteIds.length === 0) return;
    setLoading(true);
    try {
      const res = await api.get(`/sites/compare/table?ids=${selectedSiteIds.join(",")}`);
      setRows(res.data.rows);
    } finally {
      setLoading(false);
    }
  }

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortKey === "overall_score" ? a.overall_score : a.sub_scores[sortKey];
      const bv = sortKey === "overall_score" ? b.overall_score : b.sub_scores[sortKey];
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return copy.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [rows, sortKey, sortDir]);

  function sortBy(key) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const radarData = useMemo(() => {
    if (rows.length === 0) return [];
    const factors = ["resource", "geographic", "infrastructure", "environmental", "economic"];
    const labels = { resource: "Resource", geographic: "Geographic", infrastructure: "Infra", environmental: "Environmental", economic: "Economic" };
    return factors.map((f) => {
      const point = { factor: labels[f] };
      rows.forEach((r) => { point[r.name] = r.sub_scores[f]; });
      return point;
    });
  }, [rows]);

  return (
    <div className="p-8 max-w-6xl">
      <p className="label-eyebrow mb-1">Site Comparison</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Compare &amp; rank</h1>
      <p className="text-ink/55 mb-6">Select two or more registered sites to compare them side by side.</p>

      {sites.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink/50 mb-4">You need at least one registered site to compare.</p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <>
          <div className="card p-5 mb-6">
            <p className="label-eyebrow mb-3">Select sites</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {sites.map((s) => (
                <button
                  key={s.site.id}
                  onClick={() => toggleSelected(s.site.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedSiteIds.includes(s.site.id)
                      ? "bg-moss-700 text-white border-moss-700"
                      : "bg-white border-line hover:border-moss-400"
                  }`}
                >
                  {s.site.name}
                </button>
              ))}
            </div>
            <button onClick={runCompare} disabled={selectedSiteIds.length === 0 || loading} className="btn-primary">
              {loading ? "Comparing…" : `Compare ${selectedSiteIds.length || ""} site${selectedSiteIds.length === 1 ? "" : "s"}`}
            </button>
          </div>

          {rows.length > 0 && (
            <>
              <div className="card p-6 mb-6">
                <p className="label-eyebrow mb-4">Factor Radar</p>
                <ResponsiveContainer width="100%" height={340}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8df" />
                    <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12, fill: "#3d4a3f" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9aa89b" }} />
                    {rows.map((r, i) => (
                      <Radar key={r.site_id} name={r.name} dataKey={r.name}
                             stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.12} strokeWidth={2} />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="card overflow-hidden">
                <p className="label-eyebrow px-6 pt-5 pb-3">Full Comparison Table</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-line text-left text-xs text-ink/50">
                      <th className="px-6 py-2.5 font-medium">Rank</th>
                      <th className="px-3 py-2.5 font-medium">Site</th>
                      <th className="px-3 py-2.5 font-medium">Category</th>
                      {["overall_score", "resource", "geographic", "infrastructure", "environmental", "economic"].map((k) => (
                        <th key={k} className="px-3 py-2.5 font-medium cursor-pointer select-none hover:text-moss-700"
                            onClick={() => sortBy(k)}>
                          {k === "overall_score" ? "Overall" : k[0].toUpperCase() + k.slice(1)}
                          {sortKey === k && (sortDir === "desc" ? " ↓" : " ↑")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r) => (
                      <tr key={r.site_id} className="border-b border-line last:border-0 hover:bg-canvas">
                        <td className="px-6 py-3 font-mono text-ink/40">{r.rank}</td>
                        <td className="px-3 py-3 font-medium">
                          <Link to={`/sites/${r.site_id}`} className="hover:text-moss-700">{r.name}</Link>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_BADGE[r.category] || ""}`}>{r.category}</span>
                        </td>
                        <td className="px-3 py-3 font-mono font-semibold">{r.overall_score}</td>
                        <td className="px-3 py-3 font-mono">{r.sub_scores.resource}</td>
                        <td className="px-3 py-3 font-mono">{r.sub_scores.geographic}</td>
                        <td className="px-3 py-3 font-mono">{r.sub_scores.infrastructure}</td>
                        <td className="px-3 py-3 font-mono">{r.sub_scores.environmental}</td>
                        <td className="px-3 py-3 font-mono">{r.sub_scores.economic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-ink/40 px-6 py-3">
                  Click a column header to sort by that factor. Rank always reflects the overall
                  Deployment Suitability Score under the current weighting.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
