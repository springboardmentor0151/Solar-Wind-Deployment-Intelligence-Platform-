import { motion } from "framer-motion";
import { Database, BrainCircuit, MonitorSmartphone, Cloud } from "lucide-react";

const layers = [
    {
        Icon: Database,
        title: "Data Layer",
        items: ["NASA POWER", "Global Wind Atlas", "SRTM Elevation", "OSM Geocoding"],
        color: "text-emerald-400",
        border: "border-emerald-400/30",
        bg: "bg-emerald-400/5",
    },
    {
        Icon: BrainCircuit,
        title: "Intelligence Layer",
        items: ["Solar Engine", "Wind Engine", "Forecast Engine", "Investment Engine"],
        color: "text-cyan-400",
        border: "border-cyan-400/30",
        bg: "bg-cyan-400/5",
    },
    {
        Icon: Cloud,
        title: "API & Services",
        items: ["FastAPI Backend", "RESTful APIs", "Auth & Security", "Report Generation"],
        color: "text-blue-400",
        border: "border-blue-400/30",
        bg: "bg-blue-400/5",
    },
    {
        Icon: MonitorSmartphone,
        title: "Presentation Layer",
        items: ["React 19", "Realtime Dashboards", "Interactive Maps", "Analytics UI"],
        color: "text-violet-400",
        border: "border-violet-400/30",
        bg: "bg-violet-400/5",
    },
];

function Architecture() {
    return (
        <section id="architecture" className="relative py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300"
                    >
                        Architecture
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 font-display text-4xl font-bold text-white md:text-5xl"
                    >
                        A modular <span className="text-gradient">intelligence stack</span>
                    </motion.h2>
                </div>

                <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {layers.map((layer, i) => {
                        const Icon = layer.Icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                whileHover={{ y: -8 }}
                                className={`glass rounded-3xl border p-6 ${layer.border} ${layer.bg}`}
                            >
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${layer.color}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="mt-5 font-display text-lg font-semibold text-white">
                                    {layer.title}
                                </h3>
                                <ul className="mt-4 space-y-2.5">
                                    {layer.items.map((item, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-slate-400">
                                            <span className={`h-1.5 w-1.5 rounded-full ${layer.color} bg-current animate-pulse-glow`} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default Architecture;
