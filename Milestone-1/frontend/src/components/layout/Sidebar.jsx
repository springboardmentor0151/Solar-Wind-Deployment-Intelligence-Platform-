import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineFolderOpen,
  HiOutlineMapPin,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
} from "react-icons/hi2";

import { logoutUser } from "../../Authentication/authService";

// =========================
// Sidebar Navigation Items
// =========================
// (moved from Dashboard.jsx — markup/classes unchanged, now shared across all protected pages)

const navItems = [
  { label: "Dashboard", icon: HiOutlineSquares2X2, path: "/dashboard" },
  { label: "Projects", icon: HiOutlineFolderOpen, path: "/projects" },
  { label: "Site Analysis", icon: HiOutlineMapPin, path: "/analysis" },
  { label: "Reports", icon: HiOutlineDocumentChartBar, path: "/reports" },
  { label: "Settings", icon: HiOutlineCog6Tooth, path: "/settings" },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3 text-2xl font-bold">
          ⚡
          <span>
            Solar & Wind
            <span className="text-green ml-1">AI</span>
          </span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-white/70 hover:text-white text-2xl"
        >
          <HiOutlineXMark />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/dashboard"}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon className="text-xl" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-8 flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/10 transition"
      >
        <HiOutlineArrowRightOnRectangle className="text-xl" />
        Logout
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — identical to original Dashboard markup */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 text-white flex-col px-6 py-8">
        {content}
      </aside>

      {/* Mobile slide-over sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative flex w-72 min-h-screen bg-slate-900 text-white flex-col px-6 py-8">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
