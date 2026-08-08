import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFolderOpen,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaHome />,
    },
    {
      name: "Projects",
      path: "/projects",
      icon: <FaFolderOpen />,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <FaUserCircle />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-72 min-h-screen bg-gradient-to-b from-emerald-700 via-green-700 to-blue-800 text-white shadow-2xl flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <h1 className="text-4xl">🌿</h1>

        <h2 className="text-xl font-bold mt-2">
          Solar & Wind
        </h2>

        <p className="text-sm text-green-100">
          Deployment Intelligence
        </p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              location.pathname === item.path
                ? "bg-white text-green-700 shadow-lg font-semibold"
                : "hover:bg-white/20"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-white text-green-700 flex items-center justify-center text-xl font-bold">
            A
          </div>

          <div>
            <h3 className="font-semibold">Admin</h3>

            <p className="text-sm text-green-100">
              Renewable Energy Platform
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 transition-all duration-300 py-3 rounded-xl font-semibold"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;