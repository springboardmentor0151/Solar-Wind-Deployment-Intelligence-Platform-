import { motion } from "framer-motion";

function ProgressBar({
    value,
    max = 100,
    color = "from-cyan-400 to-blue-500",
    height = "h-2.5",
    className = "",
    showLabel = false,
    label = "",
}) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={className}>
            {showLabel && (
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-white">{pct.toFixed(0)}%</span>
                </div>
            )}
            <div
                className={`w-full overflow-hidden rounded-full bg-slate-800/80 ${height}`}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin="0"
                aria-valuemax="100"
            >
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full bg-gradient-to-r ${color} relative`}
                >
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-[6px] animate-pulse-glow" />
                </motion.div>
            </div>
        </div>
    );
}

export default ProgressBar;

