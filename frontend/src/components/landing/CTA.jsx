import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function CTA() {
    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-[2.5rem] glass-strong p-12 text-center md:p-20"
                >
                    <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px] animate-aurora" />
                    <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-600/20 blur-[100px] animate-aurora" style={{ animationDelay: "-5s" }} />

                    <div className="relative">
                        <h2 className="font-display text-4xl font-bold text-white md:text-6xl">
                            Ready to transform your
                            <br />
                            <span className="text-gradient">energy strategy?</span>
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-slate-400 md:text-lg">
                            Join thousands of professionals using intelligent deployment
                            analytics to make data-driven renewable energy decisions.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                to="/register"
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-[length:200%_auto] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-cyan-500/30 transition-all duration-500 hover:bg-[position:right_center] hover:scale-105 sm:w-auto"
                            >
                                Start Free Trial
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex w-full items-center justify-center rounded-2xl glass px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default CTA;
