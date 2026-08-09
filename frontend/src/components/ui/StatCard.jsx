import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

function StatCard({
    title,
    value,
    icon: Icon,
    color = "from-blue-500 to-cyan-400",
    suffix = "",
    prefix = "",
    delay = 0,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-cyan-500/10"
        >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-2xl transition-all duration-500 group-hover:scale-150" />

            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">
                        {title}
                    </p>

                    <h2 className="mt-2 font-display text-4xl font-bold text-white">
                        <AnimatedCounter
                            value={Number(value) || 0}
                            prefix={prefix}
                            suffix={suffix}
                        />
                    </h2>
                </div>

                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                    <Icon className="text-white" size={26} />
                </div>
            </div>
        </motion.div>
    );
}

export default StatCard;
