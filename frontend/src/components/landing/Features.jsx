import { motion } from "framer-motion";
import { Sun, Wind, Mountain, LineChart, BrainCircuit, Globe2 } from "lucide-react";

const features = [
    {
        Icon: Sun,
        title: "Solar Resource Assessment",
        description: "GHI, DNI, temperature and irradiation analytics powered by NASA POWER satellite data.",
        color: "from-yellow-400 to-orange-500",
        glow: "hover:shadow-yellow-500/20",
    },
    {
        Icon: Wind,
        title: "Wind Energy Analysis",
        description: "Wind speed, power density and turbine performance modeling from Global Wind Atlas.",
        color: "from-cyan-400 to-sky-500",
        glow: "hover:shadow-cyan-500/20",
    },
    {
        Icon: Mountain,
        title: "Terrain Intelligence",
        description: "SRTM elevation data and Digital Elevation Models for optimal site geometry.",
        color: "from-green-400 to-emerald-500",
        glow: "hover:shadow-emerald-500/20",
    },
    {
        Icon: LineChart,
        title: "Forecast Engine",
        description: "Predict future energy generation potential with ML-driven growth trend analysis.",
        color: "from-blue-400 to-indigo-500",
        glow: "hover:shadow-blue-500/20",
    },
    {
        Icon: BrainCircuit,
        title: "Smart Deployment",
        description: "AI-optimized deployment recommendations with priority scoring and investment risk.",
        color: "from-violet-400 to-purple-500",
        glow: "hover:shadow-violet-500/20",
    },
    {
        Icon: Globe2,
        title: "Global Coverage",
        description: "Interactive maps with OSM geocoding, location search and deployment site mapping.",
        color: "from-emerald-400 to-teal-500",
        glow: "hover:shadow-teal-500/20",
    },
];

function Features() {
    return (
        <section id="features" className="relative py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300"
                    >
                        Features
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 font-display text-4xl font-bold text-white md:text-5xl"
                    >
                        Everything you need to <span className="text-gradient">deploy smarter</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-4 max-w-2xl text-slate-400"
                    >
                        A complete suite of environmental intelligence tools designed for renewable energy professionals.
                    </motion.p>
                </div>

                <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, i) => {
                        const Icon = feature.Icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -8 }}
                                className={`group glass tilt-3d rounded-3xl p-8 transition-all duration-300 hover:bg-white/[0.06] ${feature.glow}`}
                                style={{ "--tilt-x": `${i % 2 === 0 ? 4 : -4}deg`, "--tilt-y": `${i % 2 === 0 ? -4 : 4}deg` }}
                            >
                                <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                                    <Icon className="text-white" size={28} />
                                    {/* Hover glow ring */}
                                    <span className="absolute -inset-1.5 rounded-2xl border-2 border-white/20 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:border-cyan-400/50 group-hover:blur-[1px]" />
                                </div>
                                <h3 className="mt-6 font-display text-xl font-semibold text-white transition-colors duration-300 group-hover:text-gradient">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default Features;
