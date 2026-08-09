import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SunMedium, Menu, X, ArrowRight } from "lucide-react";

const links = [
    { href: "#features", label: "Features" },
    { href: "#stats", label: "Stats" },
    { href: "#workflow", label: "Workflow" },
    { href: "#architecture", label: "Architecture" },
    { href: "#tech", label: "Tech" },
];

function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (e, href) => {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        setMobileOpen(false);
    };

    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
                scrolled
                    ? "bg-night-950/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/30"
                    : "bg-transparent"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <a href="#" className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400">
                        <SunMedium className="text-white" size={20} />
                        <div className="absolute inset-0 rounded-xl bg-cyan-400/30 blur-md animate-pulse-glow" />
                    </div>
                    <span className="font-display text-lg font-bold text-white">
                        Solar<span className="text-gradient">Wind</span>
                    </span>
                </a>

                <div className="hidden items-center gap-1 lg:flex">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={(e) => scrollTo(e, link.href)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white hover:bg-white/5"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    <Link
                        to="/login"
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
                    >
                        Sign in
                    </Link>
                    <Link
                        to="/register"
                        className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-[length:200%_auto] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-500 hover:bg-[position:right_center]"
                    >
                        Get Started
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-white/10 bg-night-950/95 backdrop-blur-2xl lg:hidden"
                    >
                        <div className="space-y-1 px-4 py-4">
                            {links.map((link, i) => (
                                <motion.a
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => scrollTo(e, link.href)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                                >
                                    {link.label}
                                </motion.a>
                            ))}
                            <div className="flex gap-3 pt-3">
                                <Link
                                    to="/login"
                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-3 text-center text-sm font-semibold text-white"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

export default LandingNavbar;
