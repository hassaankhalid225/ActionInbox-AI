import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  differenceInCalendarDays,
} from "date-fns";

/** Format integer minor units (cents) to a localized currency string. */
export function formatMoney(cents: number, currency = "PKR"): string {
  const amount = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function parseMoneyToCents(input: string | number): number {
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n ?? 0);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value ?? 0).toFixed(digits)}%`;
}

export function formatDate(date: Date | string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, "MMM d, yyyy · h:mm a");
}

/** Human, chat-style relative time used across the inbox and feeds. */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  const days = Math.abs(differenceInCalendarDays(new Date(), d));
  if (days < 7) return format(d, "EEE");
  return format(d, "MMM d");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${formatDistanceToNowStrict(d)} ago`;
}

/** Due-date helpers used for reminders / invoices. */
export function dueLabel(date: Date | string | null | undefined): {
  label: string;
  tone: "muted" | "warning" | "danger" | "success";
} {
  if (!date) return { label: "No due date", tone: "muted" };
  const d = typeof date === "string" ? new Date(date) : date;
  const days = differenceInCalendarDays(d, new Date());
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Due today", tone: "warning" };
  if (days === 1) return { label: "Due tomorrow", tone: "warning" };
  if (days <= 3) return { label: `Due in ${days}d`, tone: "warning" };
  return { label: `Due in ${days}d`, tone: "muted" };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(s: string): string {
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(s: string, max = 120): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}
