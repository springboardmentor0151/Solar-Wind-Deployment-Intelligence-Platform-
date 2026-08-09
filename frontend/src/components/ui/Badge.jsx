function Badge({ children, color = "cyan", className = "" }) {
    const colors = {
        cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
        blue: "border-blue-400/30 bg-blue-400/10 text-blue-300",
        emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
        red: "border-red-400/30 bg-red-400/10 text-red-300",
        violet: "border-violet-400/30 bg-violet-400/10 text-violet-300",
        slate: "border-slate-400/30 bg-slate-400/10 text-slate-300",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${colors[color]} ${className}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    color === "cyan" ? "bg-cyan-400"
                    : color === "blue" ? "bg-blue-400"
                    : color === "emerald" ? "bg-emerald-400"
                    : color === "amber" ? "bg-amber-400"
                    : color === "red" ? "bg-red-400"
                    : color === "violet" ? "bg-violet-400"
                    : "bg-slate-400"
                } animate-pulse-glow`}
            />
            {children}
        </span>
    );
}

export default Badge;
