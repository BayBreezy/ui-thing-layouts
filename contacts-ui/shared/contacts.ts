import type { Contact, FollowUp, LabeledValue, Preferences } from "./types";

const DAY = 86_400_000;

export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);
export const parseDateKey = (value: string) => new Date(value + "T00:00:00Z");
export function addDays(dateKey: string, days: number) {
  return toDateKey(new Date(parseDateKey(dateKey).getTime() + days * DAY));
}
export function daysBetween(from: string, to: string) {
  return Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / DAY);
}

export function fullName(contact: Pick<Contact, "firstName" | "lastName">) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}
/** The name shown in lists, honoring the "last, first" preference and falling back gracefully. */
export function displayName(
  contact: Pick<Contact, "firstName" | "lastName" | "nickname" | "company">,
  order: Preferences["nameOrder"] = "first-last"
) {
  const first = contact.firstName.trim();
  const last = contact.lastName.trim();
  if (first && last) return order === "last-first" ? `${last}, ${first}` : `${first} ${last}`;
  return first || last || contact.nickname.trim() || contact.company.trim() || "Unnamed contact";
}
export function initials(
  contact: Pick<Contact, "firstName" | "lastName" | "nickname" | "company">
) {
  const name = displayName({ ...contact }, "first-last");
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
export const primaryOf = (list: LabeledValue[]) => list.find((item) => item.primary) ?? list[0];
export const primaryEmail = (contact: Pick<Contact, "emails">) =>
  primaryOf(contact.emails)?.value ?? "";
export const primaryPhone = (contact: Pick<Contact, "phones">) =>
  primaryOf(contact.phones)?.value ?? "";
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
/** Compares phone numbers by their last ten digits so formatting never hides a duplicate. */
export const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(-10);

/** Everything a search should be able to find, lower-cased once. */
export function searchText(contact: Contact) {
  return [
    contact.firstName,
    contact.lastName,
    contact.nickname,
    contact.company,
    contact.jobTitle,
    ...contact.emails.map((item) => item.value),
    ...contact.phones.map((item) => item.value),
    ...contact.labels,
    ...contact.addresses.map((item) => `${item.city} ${item.region} ${item.country}`),
  ]
    .join(" ")
    .toLowerCase();
}
export function matchesSearch(contact: Contact, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchText(contact);
  return terms.every((term) => haystack.includes(term));
}

export function location(contact: Pick<Contact, "addresses">) {
  const address = contact.addresses[0];
  if (!address) return "";
  return [address.city, address.region || address.country].filter(Boolean).join(", ");
}

/** Next occurrence of a birthday on or after `today`, with the days until it. */
export function nextBirthday(birthday: string, today: string) {
  if (!birthday) return null;
  const [, month, day] = birthday.split("-");
  const year = Number(today.slice(0, 4));
  let date = `${year}-${month}-${day}`;
  if (date < today) date = `${year + 1}-${month}-${day}`;
  // Feb 29 in a non-leap year rolls to Mar 1, which is what a person would celebrate.
  const normalized = toDateKey(parseDateKey(date));
  return { date: normalized, days: daysBetween(today, normalized) };
}
export const isOverdue = (item: Pick<FollowUp, "dueDate" | "done">, today: string) =>
  !item.done && item.dueDate < today;
export const isDueToday = (item: Pick<FollowUp, "dueDate" | "done">, today: string) =>
  !item.done && item.dueDate === today;

export type MissingField = "email" | "phone" | "company" | "groups";
/** What a contact is missing, used by the data-health card and the clean-up page. */
export function missingFields(contact: Contact): MissingField[] {
  const missing: MissingField[] = [];
  if (contact.emails.length === 0) missing.push("email");
  if (contact.phones.length === 0) missing.push("phone");
  if (!contact.company.trim()) missing.push("company");
  if (contact.groupIds.length === 0) missing.push("groups");
  return missing;
}

export const sortedLabels = (contacts: Contact[]) => {
  const counts = new Map<string, number>();
  for (const contact of contacts)
    for (const label of contact.labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

/** A stable 0-360 hue from any string, so a person keeps their avatar color everywhere. */
export function hueFor(seed: string) {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}
