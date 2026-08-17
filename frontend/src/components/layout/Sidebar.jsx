import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  MapPinned,
  Globe2,
  Leaf,
  FileBarChart2,
  Bell,
  ClipboardCheck,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { hasRole, ROLES } from "../../utils/roles.js";
import { cn } from "../../utils/cn.js";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: null },
  {
    to: "/projects",
    label: "Projects",
    icon: FolderKanban,
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  },
  {
    to: "/sites",
    label: "Sites",
    icon: MapPinned,
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.GIS_ANALYST, ROLES.RENEWABLE_ENERGY_PLANNER],
  },
  {
    to: "/gis",
    label: "GIS Analysis",
    icon: Globe2,
    roles: [ROLES.ADMIN, ROLES.GIS_ANALYST, ROLES.PROJECT_MANAGER, ROLES.RENEWABLE_ENERGY_PLANNER],
  },
  {
    to: "/environment",
    label: "Environmental Analysis",
    icon: Leaf,
    roles: [ROLES.ADMIN, ROLES.GIS_ANALYST, ROLES.PROJECT_MANAGER, ROLES.RENEWABLE_ENERGY_PLANNER],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FileBarChart2,
    roles: [ROLES.ADMIN, ROLES.RENEWABLE_ENERGY_PLANNER, ROLES.PROJECT_MANAGER, ROLES.GIS_ANALYST],
  },
  {
    to: "/candidate-sites",
    label: "Candidate Sites",
    icon: ClipboardCheck,
    roles: [ROLES.ADMIN, ROLES.RENEWABLE_ENERGY_PLANNER, ROLES.PROJECT_MANAGER],
  },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: null },
  {
    to: "/admin",
    label: "Admin",
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
  },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || hasRole(user, ...item.roles)
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-navy-800 bg-navy-950 text-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-navy-800 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500">
              <Sun className="h-4 w-4 text-navy-950" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Helios Grid</p>
              <p className="text-[10px] uppercase tracking-wide text-navy-600">
                Deployment Intelligence
              </p>
            </div>
          </div>
          <button
            className="rounded-md p-1 text-navy-600 hover:bg-navy-800 lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-500/15 text-brand-300"
                    : "text-navy-600 hover:bg-navy-800 hover:text-white"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="border-t border-navy-800 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-navy-600">{user.role?.name}</p>
          </div>
        )}
      </aside>
    </>
  );
}