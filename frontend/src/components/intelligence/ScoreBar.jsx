export default function ScoreBar({ label, score, sub }) {
  const clamped = Math.max(0, Math.min(100, score ?? 0));
  const tone =
    clamped >= 75 ? "bg-brand-500" : clamped >= 50 ? "bg-warning-500" : "bg-danger-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-ink-faint">{sub ?? `${clamped.toFixed(0)}/100`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
