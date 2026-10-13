import { toMinutes } from "./schedule";

const dateFormats = {
  full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  long: { weekday: "short", month: "short", day: "numeric", year: "numeric" },
  short: { month: "short", day: "numeric" },
  weekday: { weekday: "short" },
  dayMonth: { weekday: "short", month: "short", day: "numeric" },
  month: { month: "long", year: "numeric" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

/** Formats a clinic-local `YYYY-MM-DD` date. The UTC time zone keeps it stable everywhere. */
export function formatDate(date: string, style: keyof typeof dateFormats | "day" = "long") {
  if (!date) return "";
  // Intl puts the day number first ("15 Thu"); a weekday then number reads better.
  if (style === "day")
    return `${new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"))} ${Number(date.slice(8, 10))}`;
  return new Intl.DateTimeFormat("en-US", { ...dateFormats[style], timeZone: "UTC" }).format(
    new Date(date + "T00:00:00Z")
  );
}

/** Formats a clinic-local `HH:mm` time as `9:30 AM` or `09:30`. */
export function formatTime(time: string, format: "12h" | "24h" = "12h") {
  if (!time) return "";
  if (format === "24h") return time;
  const minutes = toMinutes(time);
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}
export const formatRange = (start: string, end: string, format: "12h" | "24h" = "12h") =>
  `${formatTime(start, format)} – ${formatTime(end, format)}`;
export const formatDuration = (minutes: number) =>
  minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} h${minutes % 60 ? " " + (minutes % 60) + " min" : ""}`;
export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
