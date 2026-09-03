export default function MetricCard({ label, value, helper, icon: Icon, tone = "text-canopy-700 bg-canopy-50" }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      {Icon && (
        <div className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className={Icon ? "mt-5 text-sm text-slate-500" : "text-sm text-slate-500"}>{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
    </article>
  );
}
