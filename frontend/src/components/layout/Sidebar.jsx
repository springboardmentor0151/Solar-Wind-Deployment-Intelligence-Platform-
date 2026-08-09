import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, MapPinned, Search, User, SunMedium } from "lucide-react";

const items = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects", label: "Projects", icon: FolderKanban },
    { path: "/sites", label: "Sites", icon: MapPinned },
    { path: "/analysis", label: "Analysis", icon: Search },
    { path: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
    return (
        <aside className="flex w-64 flex-col border-r border-white/10 bg-night-950/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400">
                    <SunMedium className="text-white" size={20} />
                </div>
                <div>
                    <h1 className="font-display text-sm font-bold text-white">REDIP</h1>
                    <p className="text-[10px] text-slate-400">Intelligence</p>
                </div>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-4">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/30 text-white border border-cyan-400/30"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`
                            }
                        >
                            <Icon size={18} />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
