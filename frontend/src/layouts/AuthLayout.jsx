import { motion } from "framer-motion";
import { Sun, Wind, Zap } from "lucide-react";

export default function AuthLayout({ children, subtitle }) {
    return (
        <div className="noise relative flex min-h-screen overflow-hidden bg-night-950">
            {/* Animated background */}
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-aurora" />
            <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-aurora" style={{ animationDelay: "-4s" }} />
            <div className="absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px] animate-aurora" style={{ animationDelay: "-8s" }} />

            {/* Floating icons */}
            <motion.div
                className="absolute left-[12%] top-[25%] hidden lg:block"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
            >
                <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Sun className="text-yellow-400" size={30} />
                </div>
            </motion.div>
            <motion.div
                className="absolute right-[12%] top-[35%] hidden lg:block"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            >
                <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Wind className="text-cyan-400" size={30} />
                </div>
            </motion.div>
            <motion.div
                className="absolute bottom-[20%] left-[18%] hidden lg:block"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, delay: 2 }}
            >
                <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Zap className="text-emerald-400" size={30} />
                </div>
            </motion.div>

            <div className="relative z-10 flex w-full items-center justify-center px-4 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-md"
                >
                    <div className="glass-strong rounded-[2rem] p-8 shadow-2xl shadow-black/40 md:p-10">
                        <div className="mb-8 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/30">
                                <Sun className="text-white" size={28} />
                            </div>
                            <h1 className="font-display text-2xl font-bold text-white">
                                Solar <span className="text-gradient">Wind</span>
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                        </div>
                        {children}
                    </div>
                    <p className="mt-6 text-center text-xs text-slate-600">
                        © {new Date().getFullYear()} Deployment Intelligence Platform
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
