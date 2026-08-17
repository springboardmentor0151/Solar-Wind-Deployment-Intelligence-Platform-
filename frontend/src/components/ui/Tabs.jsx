import { cn } from "../../utils/cn.js";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === tab.value
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-ink-faint hover:text-ink"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
