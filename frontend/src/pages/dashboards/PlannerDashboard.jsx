import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Sun, Wind, DollarSign, MapPin, ArrowUpRight } from "lucide-react";

const CATEGORY_COLOR = {
  Excellent: "bg-moss-700",
  "Highly Suitable": "bg-moss-500",
  "Moderately Suitable": "bg-sun",
  "Low Suitability": "bg-clay",
  Unsuitable: "bg-rust",
};

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

export default function PlannerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtUsd = (n) => `$${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-8 max-w-6xl">
      <p className="label-eyebrow mb-1">Renewable Energy Planner</p>
      <h1 className="font-display text-3xl font-semibold mb-1">
        Good to see you, {user?.full_name?.split(" ")[0] || "there"}.
      </h1>
      <p className="text-ink/55 mb-8">Here's how your renewable deployment portfolio is shaping up.</p>

      {loading ? (
        <p className="text-ink/40 text-sm">Loading dashboard…</p>
      ) : !data || data.total_sites === 0 ? (
        <div className="card p-10 text-center">
          <MapPin className="mx-auto mb-3 text-moss-500" size={28} />
          <h2 className="font-display text-lg font-semibold mb-1">No sites registered yet</h2>
          <p className="text-sm text-ink/50 mb-5 max-w-sm mx-auto">
            Explore the map, analyze a location's solar and wind potential, and register your
            first site to start building your portfolio.
          </p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Registered Sites" value={data.total_sites} icon={MapPin} />
            <StatCard label="Avg. Suitability" value={`${data.average_suitability_score}`} sub="out of 100" icon={ArrowUpRight} />
            <StatCard label="Solar Output / yr" value={`${(data.total_expected_solar_mwh_year / 1000).toFixed(1)}k`} sub="MWh across portfolio" icon={Sun} />
            <StatCard label="Wind Output / yr" value={`${(data.total_expected_wind_mwh_year / 1000).toFixed(1)}k`} sub="MWh across portfolio" icon={Wind} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card p-6">
              <p className="label-eyebrow mb-4">Top Ranked Sites</p>
              <div className="space-y-3">
                {data.top_sites.map((s, i) => (
                  <Link
                    to={`/sites/${s.id}`}
                    key={s.id}
                    className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-canvas transition-colors border border-transparent hover:border-line"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-ink/35 w-4">{i + 1}</span>
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLOR[s.category] || "bg-ink/20"}`} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink/50">{s.category}</span>
                      <span className="font-mono text-sm font-semibold text-moss-700">{s.score}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <p className="label-eyebrow mb-4">Category Distribution</p>
              <div className="space-y-2.5">
                {Object.entries(data.category_distribution).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_COLOR[cat] || "bg-ink/20"}`} />
                      <span className="text-ink/70">{cat}</span>
                    </div>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-line space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-moss-600" />
                  <span className="label-eyebrow">Investment Snapshot</span>
                </div>
                <div>
                  <p className="text-xs text-ink/45">Est. total CAPEX</p>
                  <p className="font-mono font-semibold">{fmtUsd(data.total_estimated_capex_usd)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink/45">25-yr net revenue (all sites)</p>
                  <p className="font-mono font-semibold text-moss-700">{fmtUsd(data.total_lifetime_net_revenue_usd)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
