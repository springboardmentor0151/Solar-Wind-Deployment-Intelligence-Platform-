import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

const Textarea = forwardRef(function Textarea(
  { className, label, error, id, rows = 3, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-subtle">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500",
          error && "border-danger-500 focus-visible:ring-danger-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-700">{error}</p>}
    </div>
  );
});

export default Textarea;
