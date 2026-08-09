import { motion } from "framer-motion";

const tech = [
    { name: "React 19", role: "UI Framework", color: "from-cyan-400 to-blue-500" },
    { name: "Tailwind CSS", role: "Styling", color: "from-sky-400 to-cyan-500" },
    { name: "Framer Motion", role: "Animations", color: "from-violet-400 to-purple-500" },
    { name: "FastAPI", role: "Backend", color: "from-emerald-400 to-green-500" },
    { name: "Leaflet", role: "Maps", color: "from-orange-400 to-amber-500" },
    { name: "Recharts", role: "Charts", color: "from-blue-400 to-indigo-500" },
    { name: "Python", role: "Data Science", color: "from-yellow-400 to-amber-500" },
    { name: "PostgreSQL", role: "Database", color: "from-blue-500 to-indigo-600" },
];

function TechStack() {
    return (
        <section id="tech" className="relative py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300"
                    >
                        Technology
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 font-display text-4xl font-bold text-white md:text-5xl"
                    >
                        Built on <span className="text-gradient">modern foundations</span>
                    </motion.h2>
                </div>

                <div className="mt-16 flex flex-wrap justify-center gap-4">
                    {tech.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            whileHover={{ scale: 1.08, y: -4 }}
                            className="glass flex items-center gap-3 rounded-2xl px-6 py-4 transition hover:bg-white/[0.06]"
                        >
                            <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${item.color}`} />
                            <div>
                                <div className="font-display text-sm font-semibold text-white">
                                    {item.name}
                                </div>
                                <div className="text-xs text-slate-500">{item.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TechStack;
