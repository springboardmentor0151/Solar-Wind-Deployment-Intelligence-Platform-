import { cn } from "../../utils/cn.js";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border px-5 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn("text-sm font-semibold text-ink", className)}>
      {children}
    </h3>
  );
}
