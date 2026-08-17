import { format } from "date-fns";

export function formatDate(value, pattern = "MMM d, yyyy") {
  if (!value) return "\u2014";
  try {
    return format(new Date(value), pattern);
  } catch {
    return "\u2014";
  }
}

export function formatDateTime(value) {
  return formatDate(value, "MMM d, yyyy \u00b7 h:mm a");
}

export function formatNumber(value, opts = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "\u2014";
  return new Intl.NumberFormat("en-US", opts).format(value);
}

export function formatCoordinate(value) {
  if (value === null || value === undefined) return "\u2014";
  return Number(value).toFixed(5);
}

export function titleCase(value) {
  if (!value) return "";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
