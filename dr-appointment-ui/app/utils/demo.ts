import { formatDate } from "#shared/format";
import { daysBetween } from "#shared/schedule";
import type { AppointmentStatus, VisitColor } from "#shared/types";
import { referenceDate, referenceTime } from "#shared/types";

export const today = referenceDate;
export const nowTime = referenceTime;
/** A naive clinic-local timestamp, `YYYY-MM-DDTHH:mm:ss`, for records the visitor creates. */
export const now = () => {
  const stamp = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())}T${pad(stamp.getHours())}:${pad(stamp.getMinutes())}:${pad(stamp.getSeconds())}`;
};
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

/** Status is always shown with an icon and a word, never by color alone. */
export const statusMeta: Record<
  AppointmentStatus,
  { label: string; icon: string; badge: string; dot: string }
> = {
  scheduled: {
    label: "Scheduled",
    icon: "lucide:calendar",
    badge: "bg-muted text-foreground",
    dot: "bg-slate-400",
  },
  confirmed: {
    label: "Confirmed",
    icon: "lucide:calendar-check",
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  "checked-in": {
    label: "Checked in",
    icon: "lucide:door-open",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  "in-progress": {
    label: "In progress",
    icon: "lucide:activity",
    badge: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  completed: {
    label: "Completed",
    icon: "lucide:circle-check",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: "lucide:circle-x",
    badge: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    dot: "bg-zinc-400",
  },
  "no-show": {
    label: "No-show",
    icon: "lucide:user-x",
    badge: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    dot: "bg-orange-500",
  },
};

/** Visit types get a color for the calendar. The class names are literal so Tailwind sees them. */
export const visitColorClasses: Record<VisitColor, { dot: string; block: string }> = {
  rose: {
    dot: "bg-rose-500",
    block:
      "border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/60 dark:text-rose-100 hover:bg-rose-100 dark:hover:bg-rose-950",
  },
  sky: {
    dot: "bg-sky-500",
    block:
      "border-sky-500 bg-sky-50 text-sky-950 dark:bg-sky-950/60 dark:text-sky-100 hover:bg-sky-100 dark:hover:bg-sky-950",
  },
  amber: {
    dot: "bg-amber-500",
    block:
      "border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950",
  },
  teal: {
    dot: "bg-teal-500",
    block:
      "border-teal-500 bg-teal-50 text-teal-950 dark:bg-teal-950/60 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-950",
  },
  slate: {
    dot: "bg-slate-500",
    block:
      "border-slate-500 bg-slate-100 text-slate-950 dark:bg-slate-800/70 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800",
  },
  orange: {
    dot: "bg-orange-500",
    block:
      "border-orange-500 bg-orange-50 text-orange-950 dark:bg-orange-950/60 dark:text-orange-100 hover:bg-orange-100 dark:hover:bg-orange-950",
  },
};

/** The friendliest message an API failure carries. */
export function errorMessage(cause: unknown) {
  const failure = cause as {
    data?: { data?: { errors?: string[] }; statusMessage?: string };
    message?: string;
  };
  return (
    failure.data?.data?.errors?.join(" ") ||
    failure.data?.statusMessage ||
    "We couldn't complete that action. Check your connection and try again."
  );
}
/** Triggers a browser download of generated text. */
export function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
/** "Today", "Tomorrow", "Yesterday" or a short date. */
export function relativeDay(date: string) {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDate(date, "dayMonth");
}

/** A deep copy that is safe for reactive objects and keeps edits from leaking into state. */
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** An iCalendar file for one visit, in floating clinic-local time so it lands at the right hour. */
export function buildIcs(options: {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  description: string;
}) {
  const stamp = (date: string, time: string) =>
    date.replace(/-/g, "") + "T" + time.replace(":", "") + "00";
  const escape = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mendly//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${options.id}@mendly.demo`,
    `DTSTAMP:${stamp(options.date, "00:00")}`,
    `DTSTART:${stamp(options.date, options.start)}`,
    `DTEND:${stamp(options.date, options.end)}`,
    `SUMMARY:${escape(options.title)}`,
    `LOCATION:${escape(options.location)}`,
    `DESCRIPTION:${escape(options.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
