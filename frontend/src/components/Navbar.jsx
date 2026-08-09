import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";

import logo from "../assets/logo.png";

import { useAuth } from "../Authentication/AuthContext";
import { logoutUser } from "../Authentication/authService";

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);

    onScroll();

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  const displayName =
    userData?.name || currentUser?.displayName || "User";

  const photoURL =
    userData?.photoURL || currentUser?.photoURL;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-lg shadow-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10">

        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="bg-yellow-500/10 rounded-xl p-2">
            <img
              src={logo}
              alt="Solar & Wind Logo"
              className="w-10 h-10 object-contain"
            />
          </div>

          <span className="text-2xl font-bold text-slate-900 whitespace-nowrap">
            Solar & Wind
          </span>
        </Link>

        {/* Navigation */}

        <ul className="hidden lg:flex items-center gap-10 text-slate-700 font-medium">
          {links.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="hover:text-blue-600 transition"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Right */}

        <div className="hidden lg:flex items-center gap-4">
          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className="font-medium hover:text-blue-600"
              >
                Dashboard
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2"
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="w-9 h-9 rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {displayName.charAt(0)}
                  </div>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-medium hover:text-blue-600"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-semibold text-white hover:scale-105 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Button */}

        <button
          className="lg:hidden text-3xl"
          onClick={() => setOpen(!open)}
        >
          {open ? <HiX /> : <HiMenu />}
        </button>
      </nav>

      {/* Mobile Menu */}

      {open && (
        <div className="lg:hidden bg-white shadow-lg">
          <div className="flex flex-col p-6 gap-5">

            {links.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}

            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-600 py-3 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-center text-white"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}