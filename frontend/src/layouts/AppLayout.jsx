import { NavLink, Outlet } from "react-router-dom";
import { FiBarChart2, FiFolder, FiHome, FiMap, FiSettings } from "react-icons/fi";

import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/", label: "Home", icon: FiHome },
  { to: "/projects", label: "Projects", icon: FiFolder },
  { to: "/gis", label: "GIS", icon: FiMap },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
  { to: "/settings", label: "Settings", icon: FiSettings }
];

export default function AppLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-900 lg:block">
        <p className="text-sm font-semibold text-canopy-700 dark:text-canopy-500">Renewable Intelligence</p>
        <h1 className="mt-2 text-xl font-bold leading-tight">Solar & Wind Deployment</h1>
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive ? "bg-canopy-50 text-canopy-700 dark:bg-canopy-500/10 dark:text-canopy-500" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm font-semibold">{user?.full_name}</p>
          <p className="mt-1 text-xs text-slate-500">{user?.role}</p>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
          <p className="font-bold">Solar & Wind Deployment</p>
          <nav className="mt-3 grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `grid place-items-center rounded-md py-2 ${isActive ? "bg-canopy-50 text-canopy-700" : "text-slate-500"}`} aria-label={item.label}>
                  <Icon className="h-5 w-5" />
                </NavLink>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
