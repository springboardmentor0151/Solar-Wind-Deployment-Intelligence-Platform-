import { motion } from "framer-motion";
import { Search, Sun, Wind, TrendingUp, BadgeCheck } from "lucide-react";

const steps = [
    {
        Icon: Search,
        title: "Search Location",
        description: "Search any location on Earth using OSM geocoding.",
        color: "from-blue-400 to-indigo-500",
    },
    {
        Icon: Sun,
        title: "Analyze Solar",
        description: "GHI, DNI and irradiation from NASA satellite data.",
        color: "from-yellow-400 to-orange-500",
    },
    {
        Icon: Wind,
        title: "Analyze Wind",
        description: "Speed, power density and turbine viability.",
        color: "from-cyan-400 to-sky-500",
    },
    {
        Icon: TrendingUp,
        title: "Forecast Energy",
        description: "Predict future generation potential and ROI.",
        color: "from-emerald-400 to-green-500",
    },
    {
        Icon: BadgeCheck,
        title: "Deploy",
        description: "Get optimized deployment recommendations instantly.",
        color: "from-violet-400 to-purple-500",
    },
];

function Workflow() {
    return (
        <section id="workflow" className="relative py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300"
                    >
                        Workflow
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 font-display text-4xl font-bold text-white md:text-5xl"
                    >
                        From location to <span className="text-gradient">deployment</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-4 max-w-xl text-slate-400"
                    >
                        A seamless 5-step pipeline transforms raw environmental data into bankable deployment decisions.
                    </motion.p>
                </div>

                <div className="relative mt-16">
                    <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent lg:block" />
                    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
                        {steps.map((step, i) => {
                            const Icon = step.Icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.5, delay: i * 0.12 }}
                                    whileHover={{ y: -8 }}
                                    className="group relative"
                                >
                                    <div className="glass rounded-3xl p-6 text-center transition hover:bg-white/[0.06]">
                                        <div className="relative mx-auto mb-4 h-16 w-16">
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                                <Icon className="text-white" size={28} />
                                            </div>
                                            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-night-800 text-xs font-bold text-cyan-300">
                                                {i + 1}
                                            </span>
                                        </div>
                                        <h3 className="font-display text-base font-semibold text-white">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Workflow;
