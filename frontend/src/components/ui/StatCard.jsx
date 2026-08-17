import { cn } from "../../utils/cn.js";

export default function StatCard({ label, value, icon: Icon, tone = "neutral", hint }) {
  const toneClasses = {
    neutral: "bg-surface-muted text-ink-subtle",
    brand: "bg-brand-50 text-brand-700",
    info: "bg-info-50 text-info-700",
    warning: "bg-warning-50 text-warning-700",
    navy: "bg-navy-900 text-white",
  };
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-faint">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("rounded-md p-2", toneClasses[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
