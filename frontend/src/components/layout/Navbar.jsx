import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FolderKanban,
    MapPinned,
    Search,
    User,
    LogOut,
    SunMedium,
Menu,
    X,
    Plus,
} from "lucide-react";

const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects", label: "Projects", icon: FolderKanban },
    { path: "/sites", label: "Sites", icon: MapPinned },
    { path: "/analysis", label: "Analysis", icon: Search },
    { path: "/profile", label: "Profile", icon: User },
];

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token && !user) {
            const stored = localStorage.getItem("user_name");
            if (stored) setUser(stored);
        }
    }, [user]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const logout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    return (
        <motion.nav
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`sticky top-0 z-50 transition-all duration-500 ${
                scrolled
                    ? "bg-night-950/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/30"
                    : "bg-transparent border-b border-transparent"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/dashboard" className="group flex items-center gap-3 no-underline">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <SunMedium className="text-white" size={22} />
                        <div className="absolute inset-0 rounded-2xl bg-cyan-400/30 blur-md animate-pulse-glow" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="font-display text-lg font-bold text-white leading-tight">
                            Solar & Wind
                        </h1>
                        <p className="text-xs text-slate-400">
                            Deployment Intelligence
                        </p>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-1 lg:flex">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                                    isActive
                                        ? "text-white"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
{isActive && (
                                    <>
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-500/30 border border-cyan-400/30 shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)]"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                        <span className="absolute -bottom-[3px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                    </>
                                )}
                                <Icon size={16} className="relative z-10" />
                                <span className="relative z-10">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

<div className="flex items-center gap-3">
                    {/* Create actions */}
                    <div className="hidden items-center gap-2 md:flex">
                        <button
                            onClick={() => navigate("/projects?new=1")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
                        >
                            <Plus size={16} />
                            New Project
                        </button>
                        <button
                            onClick={() => navigate("/sites?new=1")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/50"
                        >
                            <Plus size={16} />
                            New Site
                        </button>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="hidden items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-all duration-300 hover:bg-red-500/20 hover:scale-105 lg:inline-flex"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t border-white/10 bg-night-950/95 backdrop-blur-2xl lg:hidden"
                    >
                        <div className="space-y-1 px-4 py-4">
                            {navItems.map((item, i) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <motion.div
                                        key={item.path}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            to={item.path}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                                                isActive
                                                    ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/30 text-white border border-cyan-400/30"
                                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            }`}
                                        >
                                            <Icon size={18} />
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                );
                            })}

<motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: navItems.length * 0.05 }}
                                onClick={() => { setMobileOpen(false); navigate("/projects?new=1"); }}
                                className="mt-2 flex w-full items-center gap-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                                <Plus size={18} />
                                New Project
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (navItems.length + 1) * 0.05 }}
                                onClick={() => { setMobileOpen(false); navigate("/sites?new=1"); }}
                                className="mt-1 flex w-full items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                            >
                                <Plus size={18} />
                                New Site
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (navItems.length + 2) * 0.05 }}
                                onClick={logout}
                                className="mt-1 flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                            >
                                <LogOut size={18} />
                                Logout
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

export default Navbar;
