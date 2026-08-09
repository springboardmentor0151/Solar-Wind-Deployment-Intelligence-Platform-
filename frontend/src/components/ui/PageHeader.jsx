import { motion } from "framer-motion";

function PageHeader({
    badge,
    title,
    subtitle,
    children,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
        >
            <div className="relative overflow-hidden rounded-3xl glass-strong p-8 shadow-xl shadow-black/30">
                {/* Animated gradient blobs */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl animate-aurora" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />
                <div className="absolute inset-0 bg-grid opacity-40" />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        {badge && (
                            <motion.p
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-glow" />
                                {badge}
                            </motion.p>
                        )}

                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mt-4 font-display text-4xl font-bold text-white md:text-5xl"
                        >
                            {title}
                        </motion.h1>

                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-3 max-w-2xl text-slate-400 md:text-lg"
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>

                    {children && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 }}
                        >
                            {children}
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default PageHeader;
