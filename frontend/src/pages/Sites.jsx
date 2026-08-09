import Input from "../components/ui/Input";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import TiltCard from "../components/ui/TiltCard";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import Skeleton from "../components/ui/Skeleton";
import SiteMap from "../components/map/SiteMap";
import LocationSearch from "../components/location/LocationSearch";

import {
    MapPinned,
    Sun,
    Wind,
    CheckCircle,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    MapPin,
    Mountain,
    Sparkles,
    Navigation,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

function Sites() {
    const [sites, setSites] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [showForm, setShowForm] = useState(searchParams.get("new") === "1");

    const [formData, setFormData] = useState({
        site_name: "",
        latitude: "",
        longitude: "",
        state: "",
        district: "",
        energy_type: "Solar",
        project_id: "",
        status: "Pending"
    });

    const [editingId, setEditingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    // search / filter
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    useEffect(() => {
        fetchSites();
        fetchProjects();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await api.get("/sites/");
            setSites(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get("/projects/");
            setProjects(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Google-Maps style location picker: auto-fills coords + state/district
    const handleLocationSelect = (loc) => {
        const parts = (loc.name || "").split(",").map((s) => s.trim());
        const state = parts.length >= 2 ? parts[parts.length - 2] : "";
        const district = parts.length >= 3 ? parts[parts.length - 3] : "";
        setFormData({
            ...formData,
            latitude: loc.latitude,
            longitude: loc.longitude,
            state: state,
            district: district,
        });
        setMessage("");
    };

    const handleEdit = (site) => {
        setEditingId(site.id);
        setIsEditing(true);
        setShowForm(true);
        setFormData({
            site_name: site.site_name,
            latitude: site.latitude,
            longitude: site.longitude,
            state: site.state,
            district: site.district,
            energy_type: site.energy_type,
            project_id: String(site.project_id),
            status: site.status
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this site?")) return;
        try {
            await api.delete(`/sites/${id}`);
            setMessage("Site deleted successfully.");
            setIsError(false);
            fetchSites();
        } catch (error) {
            setMessage(error.response?.data?.detail || "Unable to delete site.");
            setIsError(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/sites/${editingId}`, {
                    ...formData,
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude),
                    project_id: parseInt(formData.project_id)
                });
                setMessage("Site updated successfully.");
                setIsError(false);
            } else {
                await api.post("/sites/", {
                    site_name: formData.site_name,
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude),
                    state: formData.state,
                    district: formData.district,
                    energy_type: formData.energy_type,
                    project_id: parseInt(formData.project_id)
                });
                setMessage("Site created successfully.");
                setIsError(false);
            }
            setFormData({
                site_name: "", latitude: "", longitude: "", state: "", district: "",
                energy_type: "Solar", project_id: "", status: "Pending"
            });
            setEditingId(null);
            setIsEditing(false);
            setShowForm(false);
            await fetchSites();
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.detail || "Operation failed.");
            setIsError(true);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const cancelForm = () => {
        setEditingId(null);
        setIsEditing(false);
        setShowForm(false);
        setFormData({
            site_name: "", latitude: "", longitude: "", state: "", district: "",
            energy_type: "Solar", project_id: "", status: "Pending"
        });
        setMessage("");
        setIsError(false);
    };

    const solarCount = sites.filter((s) => s.energy_type === "Solar").length;
    const windCount = sites.filter((s) => s.energy_type === "Wind").length;
    const completedCount = sites.filter((s) => s.status === "Completed").length;

    const filtered = useMemo(() => {
        return sites.filter((s) => {
            const q = search.toLowerCase();
            const matchQ =
                !q ||
                s.site_name.toLowerCase().includes(q) ||
                (s.state || "").toLowerCase().includes(q) ||
                (s.district || "").toLowerCase().includes(q);
            const matchType = filterType === "All" || s.energy_type === filterType;
            const matchStatus = filterStatus === "All" || s.status === filterStatus;
            return matchQ && matchType && matchStatus;
        });
    }, [sites, search, filterType, filterStatus]);

    const stats = [
        { title: "Sites", value: sites.length, icon: MapPinned, color: "from-cyan-500 to-blue-500", glow: "hover:shadow-cyan-500/20" },
        { title: "Solar", value: solarCount, icon: Sun, color: "from-yellow-500 to-orange-500", glow: "hover:shadow-yellow-500/20" },
        { title: "Wind", value: windCount, icon: Wind, color: "from-sky-500 to-cyan-400", glow: "hover:shadow-sky-500/20" },
        { title: "Completed", value: completedCount, icon: CheckCircle, color: "from-green-500 to-emerald-400", glow: "hover:shadow-emerald-500/20" },
    ];

    const statusBadge = (status) => {
        const map = { Completed: "emerald", "In Progress": "amber", Planning: "cyan", Pending: "red" };
        return map[status] || "slate";
    };

    const projectName = (id) => {
        const p = projects.find((pr) => pr.id === Number(id));
        return p ? p.name : `Project #${id}`;
    };

    const typeIcon = (t) => (t === "Solar" ? Sun : Wind);
    const typeColor = (t) => (t === "Solar" ? "from-yellow-400 to-orange-500" : "from-cyan-400 to-sky-500");

    return (
        <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                badge="Sites"
                title="Renewable Energy Sites"
                subtitle="Manage solar and wind deployment sites with geolocation and project mapping."
                action={
                    <Button onClick={() => { setIsEditing(false); setShowForm(!showForm); }} variant={showForm ? "secondary" : "primary"}>
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? "Close" : "New Site"}
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
                        <motion.div key={s.title} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                            <TiltCard tilt={8} className={`p-6 ${s.glow}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">{s.title}</p>
                                        <h2 className="mt-2 font-display text-4xl font-bold text-white"><AnimatedCounter value={s.value} /></h2>
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

            {/* Interactive map */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-strong mt-8 overflow-hidden rounded-3xl p-2"
            >
                <SiteMap />
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                                    <Sparkles className="text-white" size={22} />
                                </div>
                                <h2 className="font-display text-2xl font-bold text-white">
                                    {isEditing ? "Update Site" : "Create New Site"}
                                </h2>
                            </div>

<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
{/* Google-Maps style location search */}
                                {!isEditing && (
                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-slate-300">
                                            Search Location
                                        </label>
                                        <div className="relative rounded-xl border border-cyan-500/30 bg-slate-800/70 p-3 transition-all duration-300 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20">
                                            <LocationSearch onLocationSelect={handleLocationSelect} />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Type a place name — coordinates, state & district are auto-filled.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <Input label="Site Name" name="site_name" value={formData.site_name} onChange={handleChange} placeholder="Enter site name" required />
                                </div>
                                <div>
                                    <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Odisha" required />
                                </div>
                                <div>
                                    <Input label="District" name="district" value={formData.district} onChange={handleChange} placeholder="Khordha" required />
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
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Latitude" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="Auto-filled" required />
                                    <Input label="Longitude" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="Auto-filled" required />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Project</label>
                                    <select
                                        name="project_id"
                                        value={formData.project_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-white outline-none transition-all duration-300 focus:border-cyan-500"
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-white outline-none transition-all duration-300 focus:border-cyan-500"
                                    >
                                        <option>Pending</option>
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-3 md:col-span-2">
                                    <Button type="submit">{isEditing ? "Update Site" : "Create Site"}</Button>
                                    {isEditing && <Button type="button" variant="secondary" onClick={cancelForm}>Cancel</Button>}
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
                        placeholder="Search sites..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500">
                        <option>All</option>
                        <option>Solar</option>
                        <option>Wind</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500">
                        <option>All</option>
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                    </select>
                </div>
            </div>

            {/* Sites grid */}
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
                            <MapPin className="text-slate-500" size={36} />
                        </div>
                        <h3 className="mt-6 font-display text-xl font-semibold text-white">No sites found</h3>
                        <p className="mt-2 max-w-sm text-sm text-slate-400">
                            {sites.length === 0 ? "Add your first deployment site to get started." : "Try adjusting your search or filters."}
                        </p>
                        {sites.length === 0 && (
                            <Button className="mt-6" onClick={() => setShowForm(true)}>
                                <Plus size={18} /> Add Site
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((site, i) => {
                            const Icon = typeIcon(site.energy_type);
                            const color = typeColor(site.energy_type);
                            return (
                                <motion.div
                                    key={site.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <TiltCard
                                        tilt={8}
                                        className="overflow-hidden"
                                        depth={
                                            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl`} />
                                        }
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                                    <Icon size={24} className="text-white" />
                                                </div>
                                                <Badge color={statusBadge(site.status)}>{site.status}</Badge>
                                            </div>

                                            <h3 className="mt-4 font-display text-lg font-semibold text-white">{site.site_name}</h3>

                                            <div className="mt-4 space-y-2 text-sm text-slate-400">
                                                <p className="flex items-center gap-2">
                                                    <MapPin size={15} className="text-cyan-400" />
                                                    {site.district}, {site.state}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Mountain size={15} className="text-emerald-400" />
                                                    <span className="font-mono">{site.latitude?.toFixed ? site.latitude.toFixed(4) : site.latitude}, {site.longitude?.toFixed ? site.longitude.toFixed(4) : site.longitude}</span>
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Navigation size={15} className="text-violet-400" />
                                                    {projectName(site.project_id)}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Sparkles size={14} /> {site.energy_type}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(site)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                                                        aria-label="Edit site"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(site.id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
                                                        aria-label="Delete site"
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

export default Sites;
