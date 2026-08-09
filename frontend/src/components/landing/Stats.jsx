import { motion } from "framer-motion";
import AnimatedCounter from "../ui/AnimatedCounter";

const stats = [
    { value: 120, suffix: "+", label: "MW Deployed", color: "from-cyan-400 to-blue-500" },
    { value: 40, suffix: "+", label: "Data Sources", color: "from-emerald-400 to-green-500" },
    { value: 98, suffix: "%", label: "Accuracy", color: "from-violet-400 to-purple-500" },
    { value: 24, suffix: "/7", label: "Monitoring", color: "from-yellow-400 to-orange-500" },
];

function Stats() {
    return (
        <section id="stats" className="relative py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="glass-strong rounded-[2rem] p-10 md:p-14">
                    <div className="grid gap-10 text-center md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ scale: 1.06, y: -4 }}
                                className="relative"
                            >
                                {/* Pulsing glow ring */}
                                <div className={`absolute left-1/2 top-6 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-xl animate-pulse-glow`} />
                                <div className="relative">
<div className={`relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                        {/* Ripple ring */}
                                        <span className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ripple" />
                                        <div className="h-3 w-3 rounded-full bg-white animate-energy-pulse" />
                                    </div>
                                    <div className="font-display text-4xl font-bold text-white md:text-5xl">
                                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                    </div>
                                    <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Stats;
