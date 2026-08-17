import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

const Input = forwardRef(function Input(
  { className, label, error, hint, id, ...props },
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
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-faint",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint disabled:opacity-70",
          error && "border-danger-500 focus-visible:ring-danger-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-700">{error}</p>}
      {!error && hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
});

export default Input;
