import { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Users, Database, Activity, ShieldCheck } from "lucide-react";

const ROLE_LABEL = {
  renewable_energy_planner: "Renewable Energy Planner",
  gis_analyst: "GIS Analyst",
  project_manager: "Project Manager",
  administrator: "Administrator",
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/admin/platform-stats"), api.get("/admin/users")])
      .then(([s, u]) => {
        setStats(s.data);
        setUsers(u.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(userId) {
    setBusyUserId(userId);
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not update this user.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeUser(userId) {
    if (!window.confirm("Remove this user and all their sites? This can't be undone.")) return;
    setBusyUserId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not remove this user.");
    } finally {
      setBusyUserId(null);
    }
  }

  if (loading) return <div className="p-8 text-sm text-ink/40">Loading admin dashboard…</div>;
  if (!stats) return null;

  return (
    <div className="p-8 max-w-6xl">
      <p className="label-eyebrow mb-1">Administrator</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Platform administration</h1>
      <p className="text-ink/55 mb-8">
        User management, platform-wide analytics, and system monitoring, {user?.full_name?.split(" ")[0] || "there"}.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={stats.total_users} sub={`${stats.active_users} active`} icon={Users} />
        <StatCard label="Total Sites" value={stats.total_sites} icon={Database} />
        <StatCard label="Analyses Run" value={stats.total_analyses_run} icon={Activity} />
        <StatCard label="Synthetic Fallback" value={stats.synthetic_fallback_enabled ? "On" : "Off"} icon={ShieldCheck} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 card overflow-hidden">
          <p className="label-eyebrow px-6 pt-5 pb-3">User Management</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs text-ink/50">
                <th className="px-6 py-2.5 font-medium">User</th>
                <th className="px-3 py-2.5 font-medium">Role</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-6 py-3">
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-[11px] text-ink/40">{u.email}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-ink/60">{ROLE_LABEL[u.role] || u.role}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active !== false ? "bg-moss-50 text-moss-700" : "bg-red-50 text-rust"}`}>
                      {u.is_active !== false ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {user?.id !== u.id && (
                        <>
                          <button
                            onClick={() => toggleActive(u.id)}
                            disabled={busyUserId === u.id}
                            className="text-xs text-ink/50 hover:text-moss-700"
                          >
                            {u.is_active !== false ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => removeUser(u.id)}
                            disabled={busyUserId === u.id}
                            className="text-xs text-rust/70 hover:text-rust"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {user?.id === u.id && <span className="text-xs text-ink/30">You</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-6">
          <p className="label-eyebrow mb-4">Users by Role</p>
          <div className="space-y-2.5 mb-6">
            {Object.entries(stats.users_by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="text-ink/70">{ROLE_LABEL[role] || role}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
          <p className="label-eyebrow mb-4">Site Status (platform-wide)</p>
          <div className="space-y-2.5">
            {Object.entries(stats.site_status_distribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-ink/70 capitalize">{status.replaceAll("_", " ")}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <p className="label-eyebrow mb-4">Data Source Management</p>
        <p className="text-xs text-ink/45 mb-4">
          Live external providers configured for the Environmental Data Collection Engine, and how
          often each one (vs. its synthetic fallback) has served an analysis platform-wide.
        </p>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
          {Object.entries(stats.configured_data_sources).map(([name, url]) => (
            <div key={name} className="flex items-center justify-between text-sm py-1.5 border-b border-line">
              <span className="text-ink/70">{name}</span>
              <span className="text-[11px] font-mono text-ink/35 truncate max-w-[220px]">{url}</span>
            </div>
          ))}
        </div>
        {Object.keys(stats.data_source_usage).length > 0 && (
          <div className="mt-4 pt-4 border-t border-line space-y-1.5">
            {Object.entries(stats.data_source_usage).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between text-xs">
                <span className="text-ink/50 font-mono">{source}</span>
                <span className="font-mono text-ink/40">{count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
