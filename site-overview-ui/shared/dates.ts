import { dataDays, referenceDate } from "./types";
import type { Preferences, RangePreset } from "./types";

const dayMs = 86_400_000;
const pattern = /^\d{4}-\d{2}-\d{2}$/;

/** Parses a `YYYY-MM-DD` string as UTC midnight. Returns NaN for anything that is not a real date. */
function parse(date: string) {
  if (!pattern.test(date)) return Number.NaN;
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const time = Date.UTC(y, m - 1, d);
  const check = new Date(time);
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d
    ? time
    : Number.NaN;
}
const format = (time: number) => new Date(time).toISOString().slice(0, 10);

export const isDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(parse(value));

export function addDays(date: string, days: number) {
  return format(parse(date) + days * dayMs);
}
/** Whole days from `a` to `b`. Positive when `b` is later. */
export function daysBetween(a: string, b: string) {
  return Math.round((parse(b) - parse(a)) / dayMs);
}
/** The Monday on or before the date. */
export function weekStart(date: string) {
  const weekday = new Date(parse(date)).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}
/** Every date from `from` to `to`, inclusive. Empty if `to` is before `from`. */
export function eachDay(from: string, to: string) {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}
/** 0 = Monday ... 6 = Sunday. */
export const weekdayIndex = (date: string) => (new Date(parse(date)).getUTCDay() + 6) % 7;

/** First day the seeded data covers. */
export const dataStart = addDays(referenceDate, -(dataDays - 1));

const presetDays: Record<Exclude<RangePreset, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * Turns a saved range into concrete dates. Custom ranges are swapped if reversed and clamped to the
 * window the data covers, so a hand-edited URL can never ask for the future.
 */
export function resolveRange(range: Preferences["range"], today = referenceDate) {
  if (range.preset !== "custom")
    return { from: addDays(today, 1 - presetDays[range.preset]), to: today };
  let from = isDate(range.from) ? range.from : addDays(today, -29);
  let to = isDate(range.to) ? range.to : today;
  if (from > to) [from, to] = [to, from];
  if (to > today) to = today;
  if (from < dataStart) from = dataStart;
  if (from > to) from = to;
  return { from, to };
}

/** The period of equal length that ends the day before `from`. */
export function previousRange(from: string, to: string) {
  const length = daysBetween(from, to) + 1;
  return { from: addDays(from, -length), to: addDays(from, -1) };
}

export function rangeLength(from: string, to: string) {
  return daysBetween(from, to) + 1;
}
