import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

function Modal({ open, onClose, title, subtitle, children, maxWidth = "max-w-lg" }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-night-950/80 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full ${maxWidth} overflow-hidden rounded-3xl border border-white/10 bg-night-900 shadow-2xl`}
                    >
                        {/* Glow decorations */}
                        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl" />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-white/10 p-6">
                                <div>
                                    <h3 className="font-display text-xl font-bold text-white">
                                        {title}
                                    </h3>
                                    {subtitle && (
                                        <p className="mt-1 text-sm text-slate-400">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="max-h-[70vh] overflow-y-auto p-6">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Modal;
