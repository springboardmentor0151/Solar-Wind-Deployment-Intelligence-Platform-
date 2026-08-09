function Skeleton({ className = "", variant = "card" }) {
    const base =
        "relative overflow-hidden rounded-2xl bg-slate-800/60 isolate";

    return (
        <div className={`${base} ${variant === "card" ? "p-6" : ""} ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="space-y-3">
                <div className="h-4 w-1/3 rounded-lg bg-slate-700/60" />
                <div className="h-8 w-2/3 rounded-xl bg-slate-700/50" />
                <div className="h-4 w-full rounded-lg bg-slate-700/40" />
                <div className="h-4 w-4/5 rounded-lg bg-slate-700/40" />
            </div>
        </div>
    );
}

export function SkeletonRow({ className = "" }) {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-slate-800/50 ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="h-14" />
        </div>
    );
}

export default Skeleton;

