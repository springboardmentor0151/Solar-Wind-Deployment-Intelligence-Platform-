import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import Input from "../components/ui/Input";
import TiltCard from "../components/ui/TiltCard";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import Skeleton from "../components/ui/Skeleton";

import {
    FolderKanban,
    Sun,
    Wind,
    BadgeCheck,
    Plus,
    Search,
    MapPin,
    Sparkles,
    Pencil,
Trash2,
    X,
    FolderOpen,
    Layers,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

const STATUS_ORDER = ["Planning", "In Progress", "Completed", "Pending"];

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        energy_type: "Solar",
        status: "Planning"
    });

    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    // search / filter / sort
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [sortBy, setSortBy] = useState("name");

    useEffect(() => {
        fetchProjects();
    }, []);

    const showMessage = (text, error = false) => {
        setMessage(text);
        setIsError(error);
        setTimeout(() => setMessage(""), 3000);
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get("/projects/");
            setProjects(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (project) => {
        setEditingId(project.id);
        setIsEditing(true);
        setShowForm(true);
        setFormData({
            name: project.name,
            description: project.description,
            location: project.location,
            energy_type: project.energy_type,
            status: project.status
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await api.delete(`/projects/${id}`);
            showMessage("Project deleted successfully.");
            await fetchProjects();
        } catch (error) {
            showMessage(
                error.response?.data?.detail || "Unable to delete project.",
                true
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/projects/${editingId}`, formData);
                showMessage("Project updated successfully.");
            } else {
                await api.post("/projects/", {
                    name: formData.name,
                    description: formData.description,
                    location: formData.location,
                    energy_type: formData.energy_type,
                });
                showMessage("Project created successfully.");
            }
            setFormData({ name: "", description: "", location: "", energy_type: "Solar", status: "Planning" });
            setEditingId(null);
            setIsEditing(false);
            setShowForm(false);
            await fetchProjects();
        } catch (error) {
            showMessage(error.response?.data?.detail || "Operation failed.", true);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        setFormData({ name: "", description: "", location: "", energy_type: "Solar", status: "Planning" });
        setMessage("");
        setIsError(false);
    };

    // Derived stats
    const totalProjects = projects.length;
    const solarProjects = projects.filter((p) => p.energy_type === "Solar").length;
    const windProjects = projects.filter((p) => p.energy_type === "Wind").length;
    const completedProjects = projects.filter((p) => p.status === "Completed").length;

    // Filter + sort
    const filtered = useMemo(() => {
        let list = projects.filter((p) => {
            const q = search.toLowerCase();
            const matchQ =
                !q ||
                p.name.toLowerCase().includes(q) ||
                (p.location || "").toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q);
            const matchType = filterType === "All" || p.energy_type === filterType;
            const matchStatus = filterStatus === "All" || p.status === filterStatus;
            return matchQ && matchType && matchStatus;
        });
        list = [...list].sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "energy_type") return a.energy_type.localeCompare(b.energy_type);
            if (sortBy === "status") {
                return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
            }
            return 0;
        });
        return list;
    }, [projects, search, filterType, filterStatus, sortBy]);

    const stats = [
        { title: "Projects", value: totalProjects, icon: FolderKanban, color: "from-blue-500 to-cyan-400", glow: "hover:shadow-cyan-500/20" },
        { title: "Solar", value: solarProjects, icon: Sun, color: "from-yellow-400 to-orange-500", glow: "hover:shadow-yellow-500/20" },
        { title: "Wind", value: windProjects, icon: Wind, color: "from-cyan-400 to-sky-500", glow: "hover:shadow-sky-500/20" },
        { title: "Completed", value: completedProjects, icon: BadgeCheck, color: "from-green-400 to-emerald-500", glow: "hover:shadow-emerald-500/20" },
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

    const typeIcon = (type) => (type === "Solar" ? Sun : Wind);
    const typeColor = (type) => (type === "Solar" ? "from-yellow-400 to-orange-500" : "from-cyan-400 to-sky-500");

    return (
        <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                badge="Projects"
                title="Renewable Energy Projects"
                subtitle="Create, organize and manage renewable energy deployment projects from one centralized workspace."
                action={
                    <Button onClick={() => { setIsEditing(false); setShowForm(!showForm); }} variant={showForm ? "secondary" : "primary"}>
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? "Close" : "New Project"}
                    </Button>
                }
            />

            {/* Stats */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
            >
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={s.title}
                            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                        >
                            <TiltCard tilt={8} className={`p-6 ${s.glow}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">{s.title}</p>
                                        <h2 className="mt-2 font-display text-4xl font-bold text-white">
                                            <AnimatedCounter value={s.value} />
                                        </h2>
                                    </div>
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                        <Icon size={26} className="text-white" />
                                    </div>
                                </div>
                            </TiltCard>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Create/Edit form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="glass-strong mt-8 rounded-3xl p-6 md:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg">
                                    <Sparkles className="text-white" size={22} />
                                </div>
                                <h2 className="font-display text-2xl font-bold text-white">
                                    {isEditing ? "Update Project" : "Create New Project"}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Project Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter project name"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                                    <textarea
                                        rows={3}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the project..."
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Bhubaneswar, Odisha"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Energy Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {["Solar", "Wind"].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, energy_type: t })}
                                                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                                                    formData.energy_type === t
                                                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/10"
                                                        : "border-slate-700 bg-slate-800/70 text-slate-400 hover:border-slate-600"
                                                }`}
                                            >
                                                {t === "Solar" ? <Sun size={16} /> : <Wind size={16} />}
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-white outline-none transition-all duration-300 focus:border-cyan-500"
                                    >
                                        <option>Planning</option>
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                        <option>Pending</option>
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-3 md:col-span-2">
                                    <Button type="submit">
                                        {isEditing ? "Update Project" : "Create Project"}
                                    </Button>
                                    {isEditing && (
                                        <Button type="button" variant="secondary" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {message && (
                                <div className={`mt-5 rounded-xl px-4 py-3 text-center font-medium ${isError ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    >
                        <option>All</option>
                        <option>Solar</option>
                        <option>Wind</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    >
                        <option>All</option>
                        <option>Planning</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Pending</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    >
                        <option value="name">Sort: Name</option>
                        <option value="energy_type">Sort: Energy</option>
                        <option value="status">Sort: Status</option>
                    </select>
                </div>
            </div>

            {/* Project cards / loading / empty */}
            <div className="mt-8">
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-strong flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center"
                    >
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/70">
                            <FolderOpen className="text-slate-500" size={36} />
                        </div>
                        <h3 className="mt-6 font-display text-xl font-semibold text-white">No projects found</h3>
                        <p className="mt-2 max-w-sm text-sm text-slate-400">
                            {projects.length === 0
                                ? "Create your first renewable energy project to get started."
                                : "Try adjusting your search or filters."}
                        </p>
                        {projects.length === 0 && (
                            <Button className="mt-6" onClick={() => setShowForm(true)}>
                                <Plus size={18} /> Create Project
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((project, i) => {
                            const Icon = typeIcon(project.energy_type);
                            const color = typeColor(project.energy_type);
                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <TiltCard
                                        tilt={8}
                                        className="p-0 overflow-hidden"
                                        depth={
                                            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl`} />
                                        }
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                                    <Icon size={24} className="text-white" />
                                                </div>
                                                <Badge color={statusBadge(project.status)}>{project.status}</Badge>
                                            </div>

                                            <h3 className="mt-4 font-display text-lg font-semibold text-white">
                                                {project.name}
                                            </h3>
                                            <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-400">
                                                {project.description || "No description."}
                                            </p>

                                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                                                <MapPin size={15} className="text-cyan-400" />
                                                {project.location || "Location not set"}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Layers size={14} /> {project.energy_type}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(project)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                                                        aria-label="Edit project"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(project.id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
                                                        aria-label="Delete project"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </TiltCard>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Projects;
