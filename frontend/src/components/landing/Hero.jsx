import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Play, Sun, Wind, Zap, Leaf, TrendingUp, Sparkles } from "lucide-react";

const floatIcons = [
    { Icon: Sun, className: "top-[22%] left-[8%]", color: "text-yellow-400", delay: 0 },
    { Icon: Wind, className: "top-[30%] right-[10%]", color: "text-cyan-400", delay: 1 },
    { Icon: Zap, className: "bottom-[28%] left-[14%]", color: "text-emerald-400", delay: 2 },
    { Icon: Leaf, className: "bottom-[22%] right-[18%]", color: "text-green-400", delay: 3 },
    { Icon: TrendingUp, className: "top-[55%] left-[3%]", color: "text-blue-400", delay: 1.5 },
];

const headline = ["Deploy", "Clean", "Energy"];

function Hero() {
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 20 });
    const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    return (
        <section
            onMouseMove={handleMouseMove}
            className="relative flex min-h-screen items-center justify-center overflow-hidden pt-24"
        >
            {/* Animated background */}
            <div className="absolute inset-0 bg-grid opacity-50 animate-grid-pan" />
            <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px] animate-aurora" />
            <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[100px] animate-aurora" style={{ animationDelay: "-4s" }} />
            <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px] animate-aurora" style={{ animationDelay: "-8s" }} />

            {/* Animated blob orb */}
            <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 animate-blob bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-emerald-500/30 blur-[60px]" />

            {/* Orbiting particles */}
            <div className="absolute left-1/2 top-1/2 hidden md:block animate-orbit" style={{ "--orbit-radius": "170px" }}>
                <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.9)] animate-energy-pulse" />
            </div>
            <div className="absolute left-1/2 top-1/2 hidden md:block animate-orbit-reverse" style={{ "--orbit-radius": "120px", borderRadius: "9999px" }}>
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)] animate-energy-pulse" style={{ animationDelay: "0.6s" }} />
            </div>
            <div className="absolute left-1/2 top-1/2 hidden md:block animate-orbit" style={{ "--orbit-radius": "210px", animationDelay: "1.2s" }}>
                <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)] animate-energy-pulse" style={{ animationDelay: "1.2s" }} />
            </div>

            {/* Floating icons */}
            {floatIcons.map(({ Icon, className, color, delay }, i) => (
                <motion.div
                    key={i}
                    className={`absolute hidden md:block ${className}`}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, delay }}
                >
                    <div className="glass flex h-16 w-16 items-center justify-center rounded-2xl animate-bounce-soft">
                        <Icon className={color} size={30} />
                    </div>
                </motion.div>
            ))}

            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 900 }}
                className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-medium text-cyan-300"
                >
                    <Sparkles size={14} className="animate-pulse-glow" />
                    Renewable Energy Intelligence Platform
                </motion.div>

                <h1 className="mt-6 flex flex-col items-center gap-2 font-display text-5xl font-bold leading-[1.1] text-white sm:text-6xl lg:text-7xl">
                    {headline.map((word, i) => (
                        <span key={i} className="flex gap-3 sm:gap-4">
                            {word.split("").map((char, j) => (
                                <motion.span
                                    key={j}
                                    initial={{ opacity: 0, y: 40, rotateX: 90 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 + i * 0.15 + j * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                    className="inline-block"
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </span>
                    ))}
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.6 }}
                        className="text-gradient bg-[length:200%_auto] animate-gradient-shift"
                    >
                        with Precision
                    </motion.span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="mx-auto mt-6 max-w-2xl text-lg text-slate-400"
                >
                    Leverage satellite data, environmental intelligence and advanced
                    analytics to identify, assess and optimize solar & wind deployment
                    sites across the globe.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    <Link
                        to="/register"
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-[length:200%_auto] px-7 py-4 text-base font-semibold text-white shadow-xl shadow-cyan-500/30 transition-all duration-500 hover:bg-[position:right_center] hover:scale-105 sm:w-auto glow-cyan"
                    >
                        Get Started Free
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                        to="/login"
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl glass px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto"
                    >
                        <Play size={18} className="text-cyan-400" />
                        Live Demo
                    </Link>
                </motion.div>

                {/* Trust stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
                >
                    {[
                        { value: "10K+", label: "Sites Analyzed" },
                        { value: "40+", label: "Data Sources" },
                        { value: "99.9%", label: "Uptime" },
                        { value: "120+", label: "Countries" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="glass rounded-2xl p-4"
                        >
                            <div className="font-display text-2xl font-bold text-gradient">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
                        </motion.div>
))}
                </motion.div>
            </motion.div>
        </section>
    );
}

export default Hero;
