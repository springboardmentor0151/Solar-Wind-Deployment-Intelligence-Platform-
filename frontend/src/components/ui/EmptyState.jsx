import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <div className="rounded-full bg-surface-muted p-3">
        <Icon className="h-6 w-6 text-ink-faint" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-ink-faint">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
