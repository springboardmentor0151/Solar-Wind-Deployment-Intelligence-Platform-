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

import logo from "../../assets/logo.png";

import { logoutUser } from "../../Authentication/authService";

// =========================
// Sidebar Navigation Items
// =========================

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
      {/* Logo */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl p-2 shadow-md">
            <img
              src={logo}
              alt="Solar & Wind Logo"
              className="w-12 h-12 object-contain"
            />
          </div>

          <div className="leading-tight">
            <h1 className="text-xl font-bold text-white whitespace-nowrap">
              Solar & Wind
            </h1>

            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              Powering Smarter Renewable Energy Decisions
            </p>
          </div>
        </div>

        {/* Mobile Close */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-white/70 hover:text-white text-2xl"
        >
          <HiOutlineXMark />
        </button>
      </div>

      {/* Navigation */}
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
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon className="text-xl" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-8 flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-red-500/20 hover:text-red-300 transition"
      >
        <HiOutlineArrowRightOnRectangle className="text-xl" />
        <span>Logout</span>
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="
          hidden
          lg:flex
          fixed
          left-0
          top-0
          h-screen
          w-64
          bg-slate-900
          text-white
          flex-col
          px-6
          py-8
          shadow-2xl
          z-50
        "
      >
        {content}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />

          <aside className="relative flex w-72 h-screen bg-slate-900 text-white flex-col px-6 py-8">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}