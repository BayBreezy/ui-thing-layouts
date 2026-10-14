import { rangeLength } from "./dates";
import type { Channel, Device, Metric, RangePreset } from "./types";

export const channelLabels: Record<Channel, string> = {
  direct: "Direct",
  organic: "Organic search",
  paid: "Paid",
  social: "Social",
  email: "Email",
  referral: "Referral",
};
export const deviceLabels: Record<Device, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
};
export const countryNames: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  IN: "India",
  BR: "Brazil",
  NL: "Netherlands",
  JP: "Japan",
  ES: "Spain",
  MX: "Mexico",
};
export const metricLabels: Record<Metric, string> = {
  sessions: "Total sessions",
  visitors: "Unique visitors",
  pageviews: "Pageviews",
  bounceRate: "Bounce rate",
  avgDuration: "Session duration",
};
export const presetLabels: Record<RangePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

const integer = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const formatNumber = (value: number) => integer.format(Math.round(value));
export const formatCompact = (value: number) =>
  Math.abs(value) < 10_000 ? formatNumber(value) : compact.format(value);
/** Takes a 0-1 ratio. */
export const formatPercent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;
/** `2:24` for 144 seconds, `1:02:03` for longer. */
export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
/** A signed one-decimal percentage, or an em dash when there is nothing to compare. */
export const formatChange = (change: number | null) =>
  change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** `Oct 13`, or `Oct 13, 2026` when `year` is set. */
export function formatDay(date: string, year = false) {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return `${months[m - 1]} ${d}${year ? `, ${y}` : ""}`;
}
export function formatRange(from: string, to: string) {
  if (from === to) return formatDay(from, true);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${formatDay(from, !sameYear)} – ${formatDay(to, true)}`;
}
export const describeRange = (from: string, to: string) =>
  `${formatRange(from, to)} · ${rangeLength(from, to)} ${rangeLength(from, to) === 1 ? "day" : "days"}`;

export function formatMetric(metric: Metric, value: number) {
  if (metric === "bounceRate") return formatPercent(value);
  if (metric === "avgDuration") return formatDuration(value);
  return formatCompact(value);
}

/** Percent change from `previous` to `current`, rounded to one decimal. Undefined when `previous` is zero. */
export function pctChange(current: number, previous: number | null | undefined) {
  if (previous === null || previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
