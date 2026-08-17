import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn.js";

const Select = forwardRef(function Select(
  { className, label, error, id, children, ...props },
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
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "h-9 w-full appearance-none rounded-md border border-border bg-white px-3 pr-8 text-sm text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500",
            error && "border-danger-500 focus-visible:ring-danger-500",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      </div>
      {error && <p className="text-xs text-danger-700">{error}</p>}
    </div>
  );
});

export default Select;
