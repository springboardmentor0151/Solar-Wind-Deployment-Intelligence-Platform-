import { motion } from "framer-motion";

const steps = [
    {
        year: "Phase 1",
        title: "Research & Data",
        description: "Aggregate global satellite, meteorological and terrain datasets.",
    },
    {
        year: "Phase 2",
        title: "Intelligence Engines",
        description: "Build solar, wind, terrain and investment scoring engines.",
    },
    {
        year: "Phase 3",
        title: "Platform Beta",
        description: "Launch interactive dashboards, maps and analysis workflows.",
    },
    {
        year: "Phase 4",
        title: "Global Scale",
        description: "Expand coverage and deliver actionable deployment intelligence.",
    },
];

function Timeline() {
    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300"
                    >
                        Roadmap
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 font-display text-4xl font-bold text-white md:text-5xl"
                    >
                        Our <span className="text-gradient">Journey</span>
                    </motion.h2>
                </div>

                <div className="relative mt-16">
                    <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-cyan-400/50 via-blue-500/50 to-transparent md:left-1/2" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className={`relative mb-12 pl-12 md:w-1/2 md:pl-0 ${
                                i % 2 === 0
                                    ? "md:pr-12 md:text-right"
                                    : "md:ml-auto md:pl-12"
                            }`}
                        >
                            <div
                                className={`absolute top-2 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-night-900 ${
                                    i % 2 === 0 ? "left-2 md:left-auto md:-right-4" : "left-2 md:-left-4"
                                }`}
                            >
                                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse-glow" />
                            </div>

                            <div className="glass rounded-2xl p-6 transition hover:bg-white/[0.06]">
                                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                                    {step.year}
                                </span>
                                <h3 className="mt-2 font-display text-xl font-semibold text-white">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Timeline;
