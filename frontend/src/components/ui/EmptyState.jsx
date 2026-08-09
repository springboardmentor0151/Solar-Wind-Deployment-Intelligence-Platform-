export default function EmptyState({
  icon: Icon,
  title = "Nothing here yet",
  message = "",
  actionLabel,
  onAction,
}) {
  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
      {Icon && (
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">
          <Icon />
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>

      {message && <p className="mt-3 text-slate-500">{message}</p>}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
