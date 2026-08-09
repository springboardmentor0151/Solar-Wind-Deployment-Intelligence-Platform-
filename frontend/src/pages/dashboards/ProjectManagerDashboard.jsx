import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Clock, CheckCircle2, XCircle, MapPin, TrendingUp } from "lucide-react";

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

export default function ProjectManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/project-manager").then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const fmtUsd = (n) => `$${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-8 max-w-6xl">
      <p className="label-eyebrow mb-1">Project Manager</p>
      <h1 className="font-display text-3xl font-semibold mb-1">
        Project progress &amp; feasibility
      </h1>
      <p className="text-ink/55 mb-8">
        Deployment timelines, cost-benefit, and feasibility status across your project portfolio,{" "}
        {user?.full_name?.split(" ")[0] || "there"}.
      </p>

      {loading ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : !data || data.total_projects === 0 ? (
        <div className="card p-10 text-center">
          <MapPin className="mx-auto mb-3 text-moss-500" size={28} />
          <h2 className="font-display text-lg font-semibold mb-1">No projects yet</h2>
          <p className="text-sm text-ink/50 mb-5 max-w-sm mx-auto">
            Register a site to start tracking its status, timeline, and feasibility.
          </p>
          <Link to="/explore" className="btn-primary inline-block">Explore deployment locations</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Projects" value={data.total_projects} icon={MapPin} />
            <StatCard label="Feasible" value={data.feasible_count} icon={CheckCircle2} sub="score ≥ 45" />
            <StatCard label="Est. Total CAPEX" value={fmtUsd(data.total_estimated_capex_usd)} icon={TrendingUp} />
            <StatCard label="Avg. Payback" value={`${data.avg_payback_years} yrs`} icon={Clock} />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2 card overflow-hidden">
              <p className="label-eyebrow px-6 pt-5 pb-3">All Projects</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-line text-left text-xs text-ink/50">
                    <th className="px-6 py-2.5 font-medium">Project</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Feasible</th>
                    <th className="px-3 py-2.5 font-medium">Payback</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p) => (
                    <tr key={p.site_id} className="border-b border-line last:border-0 hover:bg-canvas">
                      <td className="px-6 py-3">
                        <Link to={`/sites/${p.site_id}`} className="font-medium hover:text-moss-700">{p.name}</Link>
                        <p className="text-[11px] font-mono text-ink/40">{p.project_id}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {p.feasible === null ? (
                          <span className="text-ink/30 text-xs">—</span>
                        ) : p.feasible ? (
                          <CheckCircle2 size={16} className="text-moss-600" />
                        ) : (
                          <XCircle size={16} className="text-rust" />
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono">{p.simple_payback_years ? `${p.simple_payback_years} yrs` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-6">
              <p className="label-eyebrow mb-4">Status Breakdown</p>
              <div className="space-y-2.5">
                {Object.entries(data.status_distribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-line space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink/55">Total Annual OPEX</span>
                  <span className="font-mono font-semibold">{fmtUsd(data.total_estimated_annual_opex_usd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/55">25-yr Net Revenue</span>
                  <span className="font-mono font-semibold text-moss-700">{fmtUsd(data.total_lifetime_net_revenue_usd)}</span>
                </div>
              </div>
            </div>
          </div>

          {data.timeline.length > 0 && (
            <div className="card p-6">
              <p className="label-eyebrow mb-4">Deployment Timeline</p>
              <div className="space-y-3">
                {data.timeline.map((p) => (
                  <div key={p.site_id} className="flex items-center gap-4">
                    <div className="w-24 shrink-0 text-xs font-mono text-ink/50">
                      {new Date(p.target_operational_date).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-moss-600 shrink-0" />
                    <div className="flex-1 flex items-center justify-between border-b border-line pb-3">
                      <Link to={`/sites/${p.site_id}`} className="text-sm font-medium hover:text-moss-700">{p.name}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
