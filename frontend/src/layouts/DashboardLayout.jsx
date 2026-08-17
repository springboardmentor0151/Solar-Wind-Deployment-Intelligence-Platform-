import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar.jsx";
import Header from "../components/layout/Header.jsx";

const TITLES = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/sites": "Sites",
  "/gis": "GIS Analysis",
  "/intelligence": "Renewable Intelligence",
  "/environment": "Environmental Analysis",
  "/reports": "Reports",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/admin": "Admin Dashboard",
};

function resolveTitle(pathname) {
  const match = Object.keys(TITLES)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));
  return TITLES[match] || "Helios Grid";
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={resolveTitle(location.pathname)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}