import { cn } from "../../utils/cn.js";

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className={cn("w-full min-w-[640px] text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }) {
  return (
    <thead className="border-b border-border bg-surface-subtle">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-faint",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children, className, ...props }) {
  return (
    <tr className={cn("hover:bg-surface-subtle", className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ children, className }) {
  return (
    <td className={cn("px-4 py-3 align-middle text-ink", className)}>
      {children}
    </td>
  );
}
