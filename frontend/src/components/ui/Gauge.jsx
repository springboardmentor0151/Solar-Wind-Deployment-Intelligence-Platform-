import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useMotionValue } from "framer-motion";

function Gauge({
    value,
    max = 100,
    size = 160,
    stroke = 12,
    color = "#22d3ee",
    label = "",
    sublabel = "",
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));

    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { duration: 1400, bounce: 0 });

    useEffect(() => {
        if (inView) motionValue.set(pct);
    }, [inView, pct, motionValue]);

const [display, setDisplay] = useState(0);

    useEffect(() => {
        const unsub = spring.on("change", (latest) => {
            setDisplay(Math.round(latest));
        });
        return () => unsub();
    }, [spring]);

    return (
        <div
            ref={ref}
            className="relative inline-flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id={`gauge-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth={stroke}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#gauge-${label})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    whileInView={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-white" style={{ color }}>
                    {display}
                    <span className="text-base text-slate-400">/100</span>
                </span>
                {label && (
                    <span className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                        {label}
                    </span>
                )}
                {sublabel && (
                    <span className="text-[10px] text-slate-500">{sublabel}</span>
                )}
            </div>
        </div>
    );
}

export default Gauge;

