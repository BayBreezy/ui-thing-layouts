import { hueFor } from "#shared/contacts";
import { addDays } from "#shared/contacts";
import type { Contact, FollowUp, Group, GroupColor, Interaction } from "#shared/types";
import { referenceDate } from "#shared/types";

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const now = () => new Date().toISOString();
/** The demo's fixed "today". Seed data is generated relative to it. */
export const today = referenceDate;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const shortFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
export const dateLabel = (value: string, fallback = "—") =>
  value ? dateFormat.format(new Date(value)) : fallback;
export const shortDate = (value: string) => (value ? shortFormat.format(new Date(value)) : "");
/** "Today", "Tomorrow", "3 days ago" … relative to the demo's today. */
export function relativeDay(value: string) {
  if (!value) return "Never";
  const day = value.slice(0, 10);
  const difference = Math.round(
    (Date.parse(day + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86_400_000
  );
  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  if (difference === -1) return "Yesterday";
  if (difference > 1 && difference < 14) return `In ${difference} days`;
  if (difference < -1 && difference > -60) return `${-difference} days ago`;
  return dateLabel(value);
}

export function newContact(): Contact {
  const stamp = now();
  const hue = hueFor(stamp);
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    nickname: "",
    company: "",
    jobTitle: "",
    emails: [],
    phones: [],
    addresses: [],
    websites: [],
    socials: { linkedin: "", x: "", github: "", instagram: "" },
    birthday: "",
    groupIds: [],
    labels: [],
    relationship: "acquaintance",
    favorite: false,
    archived: false,
    referredById: "",
    avatarHue: hue,
    notes: "",
    source: "manual",
    lastContactedAt: "",
    createdAt: stamp,
    updatedAt: stamp,
  };
}
export function newGroup(): Group {
  return { id: crypto.randomUUID(), name: "", description: "", color: "emerald", icon: "users" };
}
export function newInteraction(contactId: string): Interaction {
  return {
    id: crypto.randomUUID(),
    contactId,
    type: "call",
    summary: "",
    occurredAt: now(),
  };
}
export function newFollowUp(contactId = ""): FollowUp {
  return {
    id: crypto.randomUUID(),
    contactId,
    title: "",
    dueDate: addDays(today, 7),
    done: false,
    priority: "medium",
  };
}

export function downloadFile(filename: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const groupColorClasses: Record<GroupColor, { soft: string; dot: string }> = {
  emerald: {
    soft: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  teal: {
    soft: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
    dot: "bg-teal-500",
  },
  sky: { soft: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", dot: "bg-sky-500" },
  amber: {
    soft: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  rose: {
    soft: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  violet: {
    soft: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
    dot: "bg-violet-500",
  },
  slate: {
    soft: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
    dot: "bg-slate-500",
  },
};
/** Literal icon names so the icon scanner bundles them for the client. */
export const groupIconNames = {
  users: "lucide:users",
  heart: "lucide:heart",
  briefcase: "lucide:briefcase",
  "building-2": "lucide:building-2",
  star: "lucide:star",
  handshake: "lucide:handshake",
  "graduation-cap": "lucide:graduation-cap",
  home: "lucide:house",
} as const;
export const interactionIcons = {
  call: "lucide:phone",
  email: "lucide:mail",
  meeting: "lucide:handshake",
  message: "lucide:message-circle",
  note: "lucide:sticky-note",
} as const;
export const relationshipLabels = {
  close: "Close",
  friend: "Friend",
  colleague: "Colleague",
  acquaintance: "Acquaintance",
} as const;
