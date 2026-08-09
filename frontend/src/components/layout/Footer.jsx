import { Link } from "react-router-dom";
import { SunMedium, Globe, MessageCircle, Share2, Mail } from "lucide-react";

function Footer() {
    return (
        <footer className="relative mt-20 border-t border-white/10 bg-night-950/70 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-3 no-underline">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400">
                                <SunMedium className="text-white" size={20} />
                            </div>
                            <span className="font-display text-lg font-bold text-white">
                                Solar & Wind
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-slate-400">
                            Deployment Intelligence Platform for renewable energy
                            analytics, environmental assessment and smart site planning.
                        </p>
<div className="mt-5 flex gap-3">
                            {[Globe, MessageCircle, Share2, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-cyan-300 hover:border-cyan-400/40 hover:-translate-y-1"
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                            Product
                        </h4>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li><Link to="/dashboard" className="hover:text-cyan-300 transition">Dashboard</Link></li>
                            <li><Link to="/projects" className="hover:text-cyan-300 transition">Projects</Link></li>
                            <li><Link to="/sites" className="hover:text-cyan-300 transition">Sites</Link></li>
                            <li><Link to="/analysis" className="hover:text-cyan-300 transition">Analysis</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                            Resources
                        </h4>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-cyan-300 transition">Documentation</a></li>
                            <li><a href="#" className="hover:text-cyan-300 transition">API Reference</a></li>
                            <li><a href="#" className="hover:text-cyan-300 transition">Smart Grid</a></li>
                            <li><a href="#" className="hover:text-cyan-300 transition">Deployment Guide</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                            Company
                        </h4>
                        <ul className="mt-4 space-y-3 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-cyan-300 transition">About</a></li>
                            <li><a href="#" className="hover:text-cyan-300 transition">Careers</a></li>
                            <li><a href="#" className="hover:text-cyan-300 transition">Contact</a></li>
                            <li><a href="#" className="hover:text-cyan-300 transition">Privacy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} Solar & Wind Deployment Intelligence. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-500">
                        Built for a sustainable future ⚡
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
