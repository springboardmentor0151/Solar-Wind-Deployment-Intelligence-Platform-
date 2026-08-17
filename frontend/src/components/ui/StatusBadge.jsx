import Badge from "./Badge.jsx";

const severityTone = {
  info: "info",
  warning: "warning",
  critical: "danger",
  success: "brand",
};

export default function StatusBadge({ severity = "info", children }) {
  return <Badge tone={severityTone[severity] || "neutral"}>{children}</Badge>;
}
