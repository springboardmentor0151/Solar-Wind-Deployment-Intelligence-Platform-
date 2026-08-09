import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FolderKanban,
    MapPinned,
    Sun,
    Wind,
    Clock3,
    BadgeCheck,
    Sparkles,
    ArrowRight,
    Activity,
    Mail,
    ShieldCheck,
    Plus,
    Search as SearchIcon,
    Loader2,
    CheckCircle2,
} from "lucide-react";

import { motion } from "framer-motion";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from "recharts";

import api from "../services/api";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import TiltCard from "../components/ui/TiltCard";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import LocationSearch from "../components/location/LocationSearch";

function useClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

function greeting(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
}

function Dashboard() {
    const navigate = useNavigate();
    const now = useClock();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        projects: 0,
        sites: 0,
        solar: 0,
        wind: 0,
        pending: 0,
        completed: 0,
    });

    const [recentProjects, setRecentProjects] = useState([]);
    const [recentSites, setRecentSites] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

const fetchUser = useCallback(async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data);
        } catch {
            localStorage.removeItem("access_token");
            navigate("/login");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUser();
        fetchStats();
        fetchRecentProjects();
        fetchRecentSites();
        fetchRecentActivity();
    }, [fetchUser]);

    const fetchStats = async () => {
        try {
            const response = await api.get("/dashboard/stats");
            setStats(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchRecentProjects = async () => {
        try {
            const response = await api.get("/projects/");
            setRecentProjects(response.data.slice(0, 5));
        } catch (error) {
            console.log(error);
        }
    };

    const fetchRecentSites = async () => {
        try {
            const response = await api.get("/sites/");
            setRecentSites(response.data.slice(0, 5));
        } catch (error) {
            console.log(error);
        }
    };

const fetchRecentActivity = async () => {
        try {
            const projectsResponse = await api.get("/projects/");
            const sitesResponse = await api.get("/sites/");

            const activity = [];

            projectsResponse.data.slice(0, 3).forEach((project) => {
                activity.push({
                    title: `Project "${project.name}" updated`,
                    detail: `${project.energy_type} deployment · ${project.location || "No location"}`,
                    time: "Recently",
                    status: project.status,
                    icon: FolderKanban,
                    color: "from-blue-500 to-cyan-400",
                    energyType: project.energy_type,
                });
            });

            sitesResponse.data.slice(0, 3).forEach((site) => {
                activity.push({
                    title: `Site "${site.site_name}" added`,
                    detail: `${site.district}, ${site.state}`,
                    time: "Recently",
                    status: site.status,
                    icon: MapPinned,
                    color: "from-emerald-500 to-teal-400",
                    energyType: site.energy_type,
                });
            });

            setRecentActivity(activity);
        } catch (error) {
            console.log(error);
        }
    };

    // ========== Modal & Quick Action State ==========
    const [projectModal, setProjectModal] = useState(false);
    const [siteModal, setSiteModal] = useState(false);
    const [analyzeModal, setAnalyzeModal] = useState(false);

    const [projectsList, setProjectsList] = useState([]);

    const [projectForm, setProjectForm] = useState({
        name: "",
        description: "",
        location: "",
        energy_type: "Solar",
    });

    const [siteForm, setSiteForm] = useState({
        site_name: "",
        latitude: "",
        longitude: "",
        state: "",
        district: "",
        energy_type: "Solar",
        project_id: "",
    });

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);
    const [submitError, setSubmitError] = useState(false);

    // Load projects when site modal opens
    useEffect(() => {
        if (siteModal) {
            api.get("/projects/")
                .then((res) => setProjectsList(res.data))
                .catch((err) => console.log(err));
        }
    }, [siteModal]);

    const refreshDashboard = async () => {
        try {
            await Promise.all([
                fetchStats(),
                fetchRecentProjects(),
                fetchRecentSites(),
                fetchRecentActivity(),
            ]);
        } catch (error) {
            console.log(error);
        }
    };

    const openProjectModal = () => {
        setSubmitMessage(null);
        setSubmitError(false);
        setProjectForm({
            name: "",
            description: "",
            location: "",
            energy_type: "Solar",
        });
        setProjectModal(true);
    };

    const openSiteModal = () => {
        setSubmitMessage(null);
        setSubmitError(false);
        setSiteForm({
            site_name: "",
            latitude: "",
            longitude: "",
            state: "",
            district: "",
            energy_type: "Solar",
            project_id: "",
        });
        setSiteModal(true);
    };

    const openAnalyzeModal = () => {
        setSubmitMessage(null);
        setSubmitError(false);
        setSelectedLocation(null);
        setAnalyzeModal(true);
    };

const handleProjectFormChange = (e) => {
        setProjectForm({
            ...projectForm,
            [e.target.name]: e.target.value,
        });
    };

    const handleSiteFormChange = (e) => {
        setSiteForm({
            ...siteForm,
            [e.target.name]: e.target.value,
        });
    };

    const createProject = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitMessage(null);
        setSubmitError(false);

        try {
            await api.post("/projects/", projectForm);
            setSubmitMessage("Project created successfully!");
            setProjectModal(false);
            await refreshDashboard();
        } catch (error) {
            setSubmitError(true);
            setSubmitMessage(
                error.response?.data?.detail || "Failed to create project."
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    const createSite = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitMessage(null);
        setSubmitError(false);

        try {
            await api.post("/sites/", {
                site_name: siteForm.site_name,
                latitude: parseFloat(siteForm.latitude),
                longitude: parseFloat(siteForm.longitude),
                state: siteForm.state,
                district: siteForm.district,
                energy_type: siteForm.energy_type,
                project_id: parseInt(siteForm.project_id),
            });
            setSubmitMessage("Site created successfully!");
            setSiteModal(false);
            await refreshDashboard();
        } catch (error) {
            setSubmitError(true);
            setSubmitMessage(
                error.response?.data?.detail || "Failed to create site."
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    const runAnalysis = async () => {
        if (!selectedLocation) return;

        setSubmitLoading(true);
        setSubmitMessage(null);
        setSubmitError(false);

        try {
            await api.post("/analysis/report", {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
            });
            setSubmitMessage(
                `Analysis complete for ${selectedLocation.name}`
            );
            setAnalyzeModal(false);
        } catch (error) {
            setSubmitError(true);
            setSubmitMessage(
                error.response?.data?.detail || "Analysis failed."
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    const cards = [
        {
            title: "Projects",
            value: stats.projects,
            icon: FolderKanban,
            color: "from-blue-500 to-cyan-400",
            glow: "hover:shadow-cyan-500/20",
        },
        {
            title: "Sites",
            value: stats.sites,
            icon: MapPinned,
            color: "from-indigo-500 to-blue-500",
            glow: "hover:shadow-indigo-500/20",
        },
        {
            title: "Solar",
            value: stats.solar,
            icon: Sun,
            color: "from-yellow-400 to-orange-500",
            glow: "hover:shadow-yellow-500/20",
        },
        {
            title: "Wind",
            value: stats.wind,
            icon: Wind,
            color: "from-cyan-400 to-sky-500",
            glow: "hover:shadow-sky-500/20",
        },
        {
            title: "Pending",
            value: stats.pending,
            icon: Clock3,
            color: "from-orange-400 to-red-500",
            glow: "hover:shadow-orange-500/20",
        },
        {
            title: "Completed",
            value: stats.completed,
            icon: BadgeCheck,
            color: "from-green-400 to-emerald-500",
            glow: "hover:shadow-emerald-500/20",
        }
    ];

    const barData = [
        { name: "Projects", value: stats.projects },
        { name: "Sites", value: stats.sites },
        { name: "Solar", value: stats.solar },
        { name: "Wind", value: stats.wind },
        { name: "Pending", value: stats.pending },
        { name: "Completed", value: stats.completed }
    ];

    const pieData = [
        { name: "Solar", value: stats.solar, color: "#fbbf24" },
        { name: "Wind", value: stats.wind, color: "#22d3ee" },
        { name: "Pending", value: stats.pending, color: "#fb923c" },
        { name: "Completed", value: stats.completed, color: "#34d399" },
    ];

    const statusBadge = (status) => {
        const map = {
            Completed: "emerald",
            "In Progress": "amber",
            Planning: "cyan",
            Pending: "red",
        };
        return map[status] || "slate";
    };

    const dateLabel = now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const timeLabel = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2rem] glass-strong p-8 md:p-12"
                style={{ transformPerspective: 1200 }}
            >
                <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl animate-aurora" />
                <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />
                <div className="absolute inset-0 bg-grid opacity-30" />

                {/* Floating 3D orbs */}
                <div className="absolute right-16 top-10 h-16 w-16 rounded-full bg-cyan-400/20 blur-2xl animate-float-lift" />
                <div className="absolute right-40 bottom-12 h-10 w-10 rounded-full bg-emerald-400/20 blur-xl animate-float-lift" style={{ animationDelay: "-2s" }} />
                <div className="absolute left-1/2 top-8 h-8 w-8 rounded-full bg-violet-400/20 blur-lg animate-float-lift" style={{ animationDelay: "-3s" }} />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Badge color="cyan">Dashboard</Badge>
                        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white md:text-5xl">
                            {greeting(now.getHours())},
                            <br />
                            <span className="text-gradient bg-[length:200%_auto] animate-gradient-shift">
                                {user?.full_name}
                            </span>
                        </h1>
                        <p className="mt-4 text-sm text-slate-400">
                            {dateLabel} · {timeLabel}
                        </p>
                        <p className="mt-4 max-w-xl text-slate-400 md:text-base">
                            Monitor renewable energy projects, deployment sites,
                            environmental data and real-time analytics from one
                            centralized intelligence platform.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3">
                            <Sparkles className="text-cyan-400" size={18} />
                            <span className="text-sm font-medium text-cyan-300">Premium Intelligence</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-energy-pulse" />
                            <span className="text-sm font-medium text-emerald-300">All systems operational</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KPI Cards (3D tilt) */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
                {cards.map((card) => {
                    const Icon = card.icon;
                    const pct = stats.projects
                        ? Math.round((card.value / stats.projects) * 100)
                        : 0;
                    return (
                        <motion.div
                            key={card.title}
                            variants={{
                                hidden: { opacity: 0, y: 30, scale: 0.96 },
                                show: { opacity: 1, y: 0, scale: 1 },
                            }}
                        >
                            <TiltCard
                                tilt={10}
                                className={`p-6 ${card.glow}`}
                                depth={
                                    <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-40`} />
                                }
                            >
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-400">
                                            {card.title}
                                        </p>
                                        <h2 className="mt-2 font-display text-5xl font-bold text-white">
                                            <AnimatedCounter value={card.value} />
                                        </h2>
                                        <div className="mt-3 w-28">
                                            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                                                <span>share</span>
                                                <span>{card.value === 0 ? 0 : pct}%</span>
                                            </div>
                                            <ProgressBar
                                                value={card.value === 0 ? 0 : pct}
                                                max={100}
                                                color={card.color}
                                                height="h-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                            <Icon size={30} />
                                        </div>
                                        <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full animate-energy-pulse`} style={{ background: "#22d3ee" }} />
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Charts row */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-strong rounded-3xl p-6 lg:col-span-2"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-white">
                            Deployment Overview
                        </h2>
                        <Badge color="blue">Live</Badge>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={barData}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.6} />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.1)" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    background: "rgba(10,4,48,0.95)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "14px",
                                    color: "#fff",
                                    backdropFilter: "blur(12px)",
                                }}
                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} fill="url(#areaGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Energy mix donut */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-strong rounded-3xl p-6"
                >
                    <div className="mb-6 flex items-center gap-2">
                        <Activity className="text-cyan-400" size={20} />
                        <h2 className="font-display text-xl font-semibold text-white">
                            Energy Mix
                        </h2>
                    </div>

                    <div className="relative mx-auto h-44 w-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={58}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    stroke="transparent"
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(10,4,48,0.95)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "14px",
                                        color: "#fff",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="font-display text-3xl font-bold text-white">
                                <AnimatedCounter value={stats.solar + stats.wind} />
                            </span>
                            <span className="text-xs text-slate-400">total</span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        {pieData.map((d) => (
                            <div key={d.name} className="flex items-center gap-2 text-sm">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                                <span className="text-slate-400">{d.name}</span>
                                <span className="ml-auto font-medium text-white">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity timeline */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="mt-8 glass-strong rounded-3xl p-6"
            >
                <div className="mb-6 flex items-center gap-2">
                    <Activity className="text-cyan-400" size={20} />
                    <h2 className="font-display text-xl font-semibold text-white">
                        Recent Activity
                    </h2>
                </div>

<div className="relative space-y-6">
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10" />
                    {recentActivity.length === 0 && (
                        <p className="text-sm text-slate-500">No activity yet.</p>
                    )}
                    {recentActivity.map((activity, index) => {
                        const Icon = activity.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className="relative flex items-start gap-4 pl-10"
                            >
                                <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${activity.color} shadow-lg`}>
                                    <Icon className="text-white" size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium text-white">{activity.title}</p>
                                        {activity.status && (
                                            <Badge color={statusBadge(activity.status)}>{activity.status}</Badge>
                                        )}
                                    </div>
                                    {activity.detail && (
                                        <p className="mt-0.5 text-xs text-slate-400">{activity.detail}</p>
                                    )}
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                        <Clock3 size={11} /> {activity.time}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Recent Projects + Sites */}
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-white">Recent Projects</h2>
                        <button onClick={() => navigate("/projects")} className="flex items-center gap-1 text-sm text-cyan-400 transition hover:text-cyan-300">
                            View all <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="glass-strong overflow-hidden rounded-3xl">
                        <table className="w-full">
                            <thead className="bg-white/[0.03]">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentProjects.length === 0 && (
                                    <tr><td colSpan="3" className="px-5 py-8 text-center text-sm text-slate-500">No projects yet.</td></tr>
                                )}
                                {recentProjects.map((project) => (
                                    <tr key={project.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                                        <td className="px-5 py-4 font-medium text-white">{project.name}</td>
                                        <td className="px-5 py-4 text-slate-300">{project.energy_type}</td>
                                        <td className="px-5 py-4"><Badge color={statusBadge(project.status)}>{project.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-white">Recent Sites</h2>
                        <button onClick={() => navigate("/sites")} className="flex items-center gap-1 text-sm text-cyan-400 transition hover:text-cyan-300">
                            View all <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="glass-strong overflow-hidden rounded-3xl">
                        <table className="w-full">
                            <thead className="bg-white/[0.03]">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Site</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Energy</th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSites.length === 0 && (
                                    <tr><td colSpan="3" className="px-5 py-8 text-center text-sm text-slate-500">No sites yet.</td></tr>
                                )}
                                {recentSites.map((site) => (
                                    <tr key={site.id} className="border-t border-white/5 transition hover:bg-white/[0.02]">
                                        <td className="px-5 py-4 font-medium text-white">{site.site_name}</td>
                                        <td className="px-5 py-4 text-slate-300">{site.energy_type}</td>
                                        <td className="px-5 py-4"><Badge color={statusBadge(site.status)}>{site.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
            >
<h2 className="mb-6 font-display text-xl font-semibold text-white">Quick Actions</h2>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { title: "New Project", desc: "Create a new renewable energy project.", icon: Plus, handler: openProjectModal, color: "from-blue-500 to-cyan-400" },
                        { title: "New Site", desc: "Register a deployment site with geolocation.", icon: MapPinned, handler: openSiteModal, color: "from-emerald-500 to-teal-400" },
                        { title: "Analyze Site", desc: "Run environmental analysis and forecasts.", icon: SearchIcon, handler: openAnalyzeModal, color: "from-violet-500 to-purple-400" },
                        { title: "Profile", desc: "Update your personal information.", icon: BadgeCheck, handler: () => navigate("/profile"), color: "from-indigo-500 to-sky-400" },
                    ].map((action) => {
                        const Icon = action.icon;
                        return (
                            <TiltCard
                                key={action.title}
                                tilt={8}
                                className="p-6"
                                depth={
                                    <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${action.color} opacity-20 blur-2xl`} />
                                }
                            >
                                <button
                                    onClick={action.handler}
                                    className="w-full text-left"
                                >
                                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} shadow-lg transition-transform group-hover:scale-110`}>
                                        <Icon size={22} className="text-white" />
                                    </div>
                                    <h3 className="mt-4 font-display text-lg font-semibold text-white">{action.title}</h3>
                                    <p className="mt-2 text-sm text-slate-400">{action.desc}</p>
                                </button>
                            </TiltCard>
                        );
                    })}
                </div>
            </motion.div>

            {/* Modal: New Project */}
            <Modal
                open={projectModal}
                onClose={() => setProjectModal(false)}
                title="Create New Project"
                subtitle="Start a new renewable energy deployment project."
            >
                <form onSubmit={createProject} className="space-y-5">
                    <Input
                        label="Project Name"
                        name="name"
                        value={projectForm.name}
                        onChange={handleProjectFormChange}
                        placeholder="e.g. Coastal Solar Farm"
                        required
                    />
                    <Input
                        label="Description"
                        name="description"
                        value={projectForm.description}
                        onChange={handleProjectFormChange}
                        placeholder="Brief description of the project"
                    />
                    <Input
                        label="Location"
                        name="location"
                        value={projectForm.location}
                        onChange={handleProjectFormChange}
                        placeholder="e.g. Puri, Odisha"
                        required
                    />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Energy Type
                        </label>
                        <select
                            name="energy_type"
                            value={projectForm.energy_type}
                            onChange={handleProjectFormChange}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
                        >
                            <option value="Solar">Solar</option>
                            <option value="Wind">Wind</option>
                        </select>
                    </div>

                    {submitMessage && (
                        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${submitError ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {submitMessage}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button type="submit" disabled={submitLoading} className="flex-1">
                            {submitLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Create Project
                                </>
                            )}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setProjectModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: New Site */}
            <Modal
                open={siteModal}
                onClose={() => setSiteModal(false)}
                title="Register New Site"
                subtitle="Add a deployment site with geolocation coordinates."
                maxWidth="max-w-2xl"
            >
                <form onSubmit={createSite} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Input
                        label="Site Name"
                        name="site_name"
                        value={siteForm.site_name}
                        onChange={handleSiteFormChange}
                        placeholder="e.g. Khordha Solar Unit"
                        required
                    />
                    <Input
                        label="State"
                        name="state"
                        value={siteForm.state}
                        onChange={handleSiteFormChange}
                        placeholder="Odisha"
                        required
                    />
                    <Input
                        label="District"
                        name="district"
                        value={siteForm.district}
                        onChange={handleSiteFormChange}
                        placeholder="Khordha"
                        required
                    />
                    <Input
                        label="Latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        value={siteForm.latitude}
                        onChange={handleSiteFormChange}
                        placeholder="20.2961"
                        required
                    />
                    <Input
                        label="Longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        value={siteForm.longitude}
                        onChange={handleSiteFormChange}
                        placeholder="85.8245"
                        required
                    />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Energy Type
                        </label>
                        <select
                            name="energy_type"
                            value={siteForm.energy_type}
                            onChange={handleSiteFormChange}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
                        >
                            <option value="Solar">Solar</option>
                            <option value="Wind">Wind</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Project
                        </label>
                        <select
                            name="project_id"
                            value={siteForm.project_id}
                            onChange={handleSiteFormChange}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
                            required
                        >
                            <option value="">Select Project</option>
                            {projectsList.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {submitMessage && (
                        <div className={`md:col-span-2 rounded-xl px-4 py-3 text-sm font-medium ${submitError ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {submitMessage}
                        </div>
                    )}

                    <div className="flex gap-3 md:col-span-2">
                        <Button type="submit" disabled={submitLoading} className="flex-1">
                            {submitLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <MapPinned size={18} />
                                    Create Site
                                </>
                            )}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setSiteModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Analyze Site */}
            <Modal
                open={analyzeModal}
                onClose={() => setAnalyzeModal(false)}
                title="Analyze a Location"
                subtitle="Run a full environmental and resource assessment."
            >
                <div className="space-y-5">
                    <LocationSearch onLocationSelect={setSelectedLocation} />

                    {selectedLocation && (
                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <CheckCircle2 size={18} />
                                <span className="text-sm font-medium">Location Selected</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{selectedLocation.name}</p>
                            <div className="mt-3 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Latitude</p>
                                    <p className="font-semibold text-white">{selectedLocation.latitude}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Longitude</p>
                                    <p className="font-semibold text-white">{selectedLocation.longitude}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {submitMessage && (
                        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${submitError ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {submitMessage}
                        </div>
                    )}

                    <Button
                        onClick={runAnalysis}
                        disabled={!selectedLocation || submitLoading}
                        className="w-full"
                    >
                        {submitLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <SearchIcon size={18} />
                                Analyze Location
                            </>
                        )}
                    </Button>
                </div>
            </Modal>

            {/* User Info */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="mt-8 flex flex-col gap-6 glass-strong rounded-3xl p-8 md:flex-row md:items-center md:justify-between"
            >
                <div className="flex items-center gap-5">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-bold text-white shadow-lg">
                        {user?.full_name?.charAt(0)}
                        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-night-900 bg-emerald-400" />
                        <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-lg animate-pulse-glow" />
                    </div>
                    <div>
                        <h2 className="font-display text-xl font-bold text-white">{user?.full_name}</h2>
                        <p className="text-sm text-slate-400">System Administrator</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 text-sm md:items-end">
                    <p className="flex items-center gap-2 text-slate-300"><Mail size={16} className="text-slate-500" />{user?.email}</p>
                    <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-slate-500" /><span className="capitalize text-cyan-400">{user?.role}</span></p>
                </div>
            </motion.div>
        </div>
    );
}

export default Dashboard;
