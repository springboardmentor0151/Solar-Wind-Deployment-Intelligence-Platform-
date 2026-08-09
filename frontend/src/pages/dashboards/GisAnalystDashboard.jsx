import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Mountain, Leaf, Route, ShieldAlert, MapPin } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="label-eyebrow">{label}</span>
        {Icon && <Icon size={16} className="text-moss-600" />}
      </div>
      <p className="font-display text-3xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-ink/45 mt-1">{sub}</p>}
    </div>
  );
}

export default function GisAnalystDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/gis-analyst").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      <p className="label-eyebrow mb-1">GIS Analyst</p>
      <h1 className="font-display text-3xl font-semibold mb-1">
        Terrain &amp; environmental intelligence
      </h1>
      <p className="text-ink/55 mb-8">
        Geospatial analytics, terrain characteristics, and infrastructure proximity across your
        mapped sites, {user?.full_name?.split(" ")[0] || "there"}.
      </p>

      {loading ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : !data || data.total_sites_mapped === 0 ? (
        <div className="card p-10 text-center">
          <MapPin className="mx-auto mb-3 text-moss-500" size={28} />
          <h2 className="font-display text-lg font-semibold mb-1">No sites mapped yet</h2>
          <p className="text-sm text-ink/50 mb-5 max-w-sm mx-auto">
            Analyze and register a location to start building terrain and environmental profiles.
          </p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Sites Mapped" value={data.total_sites_mapped} icon={MapPin} />
            <StatCard label="Avg. Elevation" value={`${data.avg_elevation_m}m`} icon={Mountain} />
            <StatCard label="Avg. Land Slope" value={`${data.avg_land_slope_pct}%`} icon={Route} />
            <StatCard label="Avg. Vegetation Index" value={data.avg_vegetation_index} icon={Leaf} />
          </div>

          {(data.protected_zone_flags > 0 || data.agricultural_land_flags > 0) && (
            <div className="card p-4 mb-6 border-sun/40 bg-amber-50/40 flex items-start gap-3">
              <ShieldAlert size={18} className="text-sun mt-0.5 shrink-0" />
              <p className="text-sm text-ink/70">
                <strong>{data.protected_zone_flags}</strong> site(s) flagged near a protected zone,{" "}
                <strong>{data.agricultural_land_flags}</strong> near agricultural land. Review the
                Environmental sub-score before advancing these to feasibility.
              </p>
            </div>
          )}

          <div className="card overflow-hidden mb-6">
            <p className="label-eyebrow px-6 pt-5 pb-3">Site Terrain &amp; Infrastructure</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-line text-left text-xs text-ink/50">
                  <th className="px-6 py-2.5 font-medium">Site</th>
                  <th className="px-3 py-2.5 font-medium">Elevation</th>
                  <th className="px-3 py-2.5 font-medium">Slope</th>
                  <th className="px-3 py-2.5 font-medium">NDVI</th>
                  <th className="px-3 py-2.5 font-medium">Road</th>
                  <th className="px-3 py-2.5 font-medium">Substation</th>
                  <th className="px-3 py-2.5 font-medium">Geo. Score</th>
                  <th className="px-3 py-2.5 font-medium">Env. Score</th>
                  <th className="px-3 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.sites.map((s) => (
                  <tr key={s.site_id} className="border-b border-line last:border-0 hover:bg-canvas">
                    <td className="px-6 py-3 font-medium">
                      {s.name}
                      {(s.near_protected_zone || s.near_agricultural_land) && (
                        <ShieldAlert size={12} className="inline ml-1.5 text-sun" />
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono">{s.elevation_m}m</td>
                    <td className="px-3 py-3 font-mono">{s.land_slope_pct}%</td>
                    <td className="px-3 py-3 font-mono">{s.vegetation_index}</td>
                    <td className="px-3 py-3 font-mono">{s.distance_to_road_km}km</td>
                    <td className="px-3 py-3 font-mono">{s.distance_to_substation_km}km</td>
                    <td className="px-3 py-3 font-mono">{s.geographic_score}</td>
                    <td className="px-3 py-3 font-mono">{s.environmental_score}</td>
                    <td className="px-3 py-3">
                      <Link to={`/sites/${s.site_id}`} className="text-xs text-moss-700 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-6">
            <p className="label-eyebrow mb-4">Data Source Provenance</p>
            <p className="text-xs text-ink/45 mb-4">
              Which live vs. fallback data providers were used across your latest site analyses.
            </p>
            <div className="space-y-2">
              {Object.entries(data.data_source_usage).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-ink/70 font-mono text-xs">{source}</span>
                  <span className="font-mono text-ink/50">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
