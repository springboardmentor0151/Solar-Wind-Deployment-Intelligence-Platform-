import { cn } from "../../utils/cn.js";

const tones = {
  neutral: "bg-surface-muted text-ink-subtle border-border",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  info: "bg-info-50 text-info-700 border-info-500/20",
  warning: "bg-warning-50 text-warning-700 border-warning-500/20",
  danger: "bg-danger-50 text-danger-700 border-danger-500/20",
  navy: "bg-navy-900/5 text-navy-900 border-navy-900/10",
};

export default function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone] || tones.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
