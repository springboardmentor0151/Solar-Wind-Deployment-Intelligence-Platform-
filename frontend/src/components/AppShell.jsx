import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSites } from "../context/SitesContext";
import { Sun } from "lucide-react";

const NAV = [
  { idx: "00", label: "Dashboard", to: "/" },
  { idx: "01", label: "Explore Sites", to: "/explore" },
  { idx: "02", label: "Site Intelligence", to: "/sites" },
  { idx: "03", label: "Compare & Rank", to: "/compare" },
  { idx: "04", label: "Reports", to: "/reports" },
  { idx: "05", label: "Capacity Planner", to: "/planner" },
];

const CATEGORY_DOT = {
  Excellent: "bg-moss-700",
  "Highly Suitable": "bg-moss-500",
  "Moderately Suitable": "bg-sun",
  "Low Suitability": "bg-clay",
  Unsuitable: "bg-rust",
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { sites } = useSites();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-canvas">
      <aside className="w-72 shrink-0 border-r border-line bg-panel flex flex-col h-screen sticky top-0">
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-moss-700 flex items-center justify-center">
              <Sun size={17} className="text-moss-100" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight">Renewsite</span>
          </div>
          <p className="label-eyebrow mt-2 leading-tight">Solar &amp; Wind Deployment<br />Intelligence</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-moss-50 text-moss-800 font-medium ring-1 ring-moss-200"
                    : "text-ink/70 hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <span className="font-mono text-[11px] text-moss-600/70 w-5">{item.idx}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-4">
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <span className="label-eyebrow">Registered Sites</span>
            <span className="text-xs font-mono text-ink/50">{sites.length}</span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 px-1">
            {sites.length === 0 && (
              <p className="px-2 text-xs text-ink/40 leading-relaxed">
                No sites yet. Analyze a location and register it to see it here.
              </p>
            )}
            {sites.map((s) => (
              <button
                key={s.site.id}
                onClick={() => navigate(`/sites/${s.site.id}`)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-canvas transition-colors group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{s.site.name}</span>
                  {s.category && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_DOT[s.category] || "bg-ink/20"}`} />
                  )}
                </div>
                <span className="text-[11px] font-mono text-ink/40">
                  {s.site.latitude.toFixed(3)}, {s.site.longitude.toFixed(3)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <p className="text-sm font-medium">{user?.full_name || "Guest"}</p>
          <p className="text-xs text-ink/50 capitalize">{(user?.role || "").replaceAll("_", " ")}</p>
          <button onClick={logout} className="text-xs text-moss-700 hover:underline mt-1">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
