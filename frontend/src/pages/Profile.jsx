import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    User,
    Save,
    Lock,
KeyRound,
    Mail,
    ShieldCheck,
    Activity,
    FolderKanban,
    MapPinned,
    Sun,
    Wind,
    BadgeCheck,
    Clock3,
    Plus,
    Search as SearchIcon,
    ArrowRight,
} from "lucide-react";

import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import TiltCard from "../components/ui/TiltCard";

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState({
        full_name: "",
        email: "",
        role: "",
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [passwordMessage, setPasswordMessage] = useState("");

    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/dashboard/stats");
            setStats(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordInput = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put("/auth/profile", {
                full_name: user.full_name,
            });
            setUser(response.data);
            setMessage("Profile updated successfully.");
        } catch (error) {
            console.error(error);
            setMessage("Failed to update profile.");
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put("/auth/change-password", passwordData);
            setPasswordMessage(response.data.message);
            setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
        } catch (error) {
            setPasswordMessage(error.response?.data?.detail || "Something went wrong.");
        }
        setTimeout(() => setPasswordMessage(""), 4000);
    };

    const statCards = stats ? [
        { title: "Projects", value: stats.projects, icon: FolderKanban, color: "from-blue-500 to-cyan-400" },
        { title: "Sites", value: stats.sites, icon: MapPinned, color: "from-indigo-500 to-blue-500" },
        { title: "Solar", value: stats.solar, icon: Sun, color: "from-yellow-400 to-orange-500" },
        { title: "Wind", value: stats.wind, icon: Wind, color: "from-cyan-400 to-sky-500" },
        { title: "Pending", value: stats.pending, icon: Clock3, color: "from-orange-400 to-red-500" },
        { title: "Completed", value: stats.completed, icon: BadgeCheck, color: "from-green-400 to-emerald-500" },
    ] : [];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-night-950">
                <div className="flex items-center gap-3 text-lg text-cyan-400">
                    <span className="h-3 w-3 rounded-full bg-cyan-400 animate-energy-pulse" />
                    Loading profile...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                badge="Profile"
                title="My Profile"
                subtitle="Manage your personal information, account settings and view your platform activity."
            />

            {/* Profile hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl glass-strong p-8"
            >
                <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-cyan-500/12 blur-3xl animate-aurora" />
                <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-blue-600/12 blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />

                <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row">
                    <div className="relative">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-5xl font-bold text-white shadow-2xl shadow-cyan-500/30">
                            {user.full_name?.charAt(0) || <User size={48} />}
                        </div>
                        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-night-900 bg-emerald-400" />
                        <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl animate-pulse-glow" style={{ animationDuration: "3.5s" }} />
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="font-display text-3xl font-bold text-white">{user.full_name}</h1>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                            <Badge color="cyan">{user.role}</Badge>
                            <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                <Mail size={14} /> {user.email}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
            >
                {statCards.map((s) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={s.title}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                        >
                            <TiltCard tilt={6} className="p-4">
                                <div className="text-center">
                                    <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}>
                                        <Icon size={20} className="text-white" />
                                    </div>
                                    <p className="mt-2 font-display text-2xl font-bold text-white">
                                        <AnimatedCounter value={s.value} />
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{s.title}</p>
                                </div>
                            </TiltCard>
                        </motion.div>
                    );
                })}
            </motion.div>

{/* Quick actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
                {[
                    { title: "New Project", desc: "Create a project", icon: Plus, path: "/projects", color: "from-blue-500 to-cyan-400" },
                    { title: "New Site", desc: "Register a site", icon: MapPinned, path: "/sites", color: "from-emerald-500 to-teal-400" },
                    { title: "Analyze Site", desc: "Run analysis", icon: SearchIcon, path: "/analysis", color: "from-violet-500 to-purple-400" },
                    { title: "Dashboard", desc: "View overview", icon: ArrowRight, path: "/dashboard", color: "from-indigo-500 to-sky-400" },
                ].map((action) => {
                    const Icon = action.icon;
                    return (
                        <TiltCard key={action.title} tilt={6} className="p-4">
                            <button
                                onClick={() => navigate(action.path)}
                                className="flex w-full items-center gap-3 text-left"
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg transition-transform group-hover:scale-110`}>
                                    <Icon size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{action.title}</p>
                                    <p className="text-xs text-slate-400">{action.desc}</p>
                                </div>
                            </button>
                        </TiltCard>
                    );
                })}
            </motion.div>

            {/* Profile & Security forms */}
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                {/* Profile form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card hover={false}>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                                <User className="text-white" size={22} />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-white">Personal Information</h2>
                                <p className="text-sm text-slate-400">Update your profile details</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            <Input
                                label="Full Name"
                                name="full_name"
                                value={user.full_name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                            />
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-slate-400">
                                    <Mail size={16} />
                                    {user.email}
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Role</label>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                                    <ShieldCheck size={16} className="text-cyan-400" />
                                    <span className="capitalize text-white">{user.role}</span>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                <Save size={18} /> Update Profile
                            </Button>
                        </form>

                        {message && (
                            <div className={`mt-5 rounded-xl px-4 py-3 text-center font-medium ${
                                message.includes("Failed") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                            }`}>
                                {message}
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Security form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card hover={false}>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                                <Lock className="text-white" size={22} />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-white">Security</h2>
                                <p className="text-sm text-slate-400">Change your account password</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="mt-8 space-y-5">
                            <Input
                                label="Current Password"
                                type="password"
                                name="current_password"
                                value={passwordData.current_password}
                                onChange={handlePasswordInput}
                                placeholder="Enter current password"
                            />
                            <Input
                                label="New Password"
                                type="password"
                                name="new_password"
                                value={passwordData.new_password}
                                onChange={handlePasswordInput}
                                placeholder="Enter new password"
                            />
                            <Input
                                label="Confirm Password"
                                type="password"
                                name="confirm_password"
                                value={passwordData.confirm_password}
                                onChange={handlePasswordInput}
                                placeholder="Confirm new password"
                            />
                            <Button type="submit" className="w-full">
                                <KeyRound size={18} /> Change Password
                            </Button>
                        </form>

                        {passwordMessage && (
                            <div className={`mt-5 rounded-xl px-4 py-3 text-center font-medium ${
                                passwordMessage.includes("wrong") ||
                                passwordMessage.includes("failed") ||
                                passwordMessage.includes("Something")
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-green-500/20 text-green-400"
                            }`}>
                                {passwordMessage}
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Activity timeline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
            >
                <Card hover={false}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg">
                            <Activity className="text-white" size={22} />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">Recent Activity</h2>
                            <p className="text-sm text-slate-400">Your latest platform actions</p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="relative space-y-6">
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/5" />

                            {[
                                { icon: FolderKanban, title: "Logged into the platform", time: "Just now", color: "from-cyan-500 to-blue-500" },
                                { icon: MapPinned, title: "Profile information viewed", time: "Active session", color: "from-emerald-500 to-teal-400" },
                                { icon: BadgeCheck, title: "Account created", time: "Registration date", color: "from-violet-500 to-purple-400" },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        className="relative flex items-start gap-4 pl-10"
                                    >
                                        <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                                            <Icon className="text-white" size={18} />
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-sm font-medium text-white">{item.title}</p>
                                            <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}

export default Profile;
