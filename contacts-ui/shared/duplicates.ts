import { normalizeEmail, normalizePhone } from "./contacts";
import type { Contact } from "./types";

export type DuplicateReason = "email" | "phone" | "name";
export interface DuplicatePair {
  key: string;
  a: Contact;
  b: Contact;
  reason: DuplicateReason;
}

const nameKey = (contact: Contact) =>
  `${contact.firstName} ${contact.lastName}`.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Finds likely duplicates among active contacts. A shared email is the strongest signal, then a
 * shared phone number, then an identical full name. Each pair is reported once with its strongest
 * reason.
 */
export function findDuplicates(contacts: Contact[]): DuplicatePair[] {
  const active = contacts.filter((contact) => !contact.archived);
  const pairs = new Map<string, DuplicatePair>();
  const reasons: [DuplicateReason, (contact: Contact) => string[]][] = [
    ["email", (contact) => contact.emails.map((item) => normalizeEmail(item.value))],
    ["phone", (contact) => contact.phones.map((item) => normalizePhone(item.value))],
    ["name", (contact) => [nameKey(contact)]],
  ];
  for (const [reason, keysOf] of reasons) {
    const buckets = new Map<string, Contact[]>();
    for (const contact of active) {
      for (const key of new Set(keysOf(contact))) {
        // Short keys (an empty name, a three digit extension) are never evidence.
        if (key.length < (reason === "phone" ? 7 : 3) || (reason === "name" && !key.includes(" ")))
          continue;
        buckets.set(key, [...(buckets.get(key) ?? []), contact]);
      }
    }
    for (const group of buckets.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const first = group[i]!;
          const second = group[j]!;
          const [a, b] = first.id < second.id ? [first, second] : [second, first];
          const key = `${a.id}:${b.id}`;
          if (!pairs.has(key)) pairs.set(key, { key, a, b, reason });
        }
      }
    }
  }
  return [...pairs.values()];
}

const union = <T>(first: T[], second: T[], keyOf: (item: T) => string) => {
  const seen = new Set(first.map(keyOf));
  return [...first, ...second.filter((item) => !seen.has(keyOf(item)))];
};

/**
 * Merges `secondary` into `primary`. The primary wins every conflict, empty fields are filled from
 * the secondary, and lists are combined without repeating a value.
 */
export function mergeContacts(primary: Contact, secondary: Contact, now: string): Contact {
  const pick = (a: string, b: string) => (a.trim() ? a : b);
  const emails = union(primary.emails, secondary.emails, (item) => normalizeEmail(item.value));
  const phones = union(primary.phones, secondary.phones, (item) => normalizePhone(item.value));
  const keepPrimary = <T extends { primary: boolean }>(list: T[]) =>
    list.map((item, index) => ({
      ...item,
      primary: list.some((entry) => entry.primary) ? item.primary : index === 0,
    }));
  const notes =
    primary.notes.trim() &&
    secondary.notes.trim() &&
    primary.notes.trim() !== secondary.notes.trim()
      ? `${primary.notes.trim()}\n\n${secondary.notes.trim()}`
      : pick(primary.notes, secondary.notes);
  return {
    ...primary,
    firstName: pick(primary.firstName, secondary.firstName),
    lastName: pick(primary.lastName, secondary.lastName),
    nickname: pick(primary.nickname, secondary.nickname),
    company: pick(primary.company, secondary.company),
    jobTitle: pick(primary.jobTitle, secondary.jobTitle),
    emails: keepPrimary(emails),
    phones: keepPrimary(phones),
    addresses: union(primary.addresses, secondary.addresses, (item) =>
      `${item.street}|${item.city}`.toLowerCase()
    ),
    websites: union(primary.websites, secondary.websites, (item) => item.toLowerCase()),
    socials: {
      linkedin: pick(primary.socials.linkedin, secondary.socials.linkedin),
      x: pick(primary.socials.x, secondary.socials.x),
      github: pick(primary.socials.github, secondary.socials.github),
      instagram: pick(primary.socials.instagram, secondary.socials.instagram),
    },
    birthday: pick(primary.birthday, secondary.birthday),
    groupIds: union(primary.groupIds, secondary.groupIds, (item) => item),
    labels: union(primary.labels, secondary.labels, (item) => item.toLowerCase()),
    favorite: primary.favorite || secondary.favorite,
    referredById:
      primary.referredById || (secondary.referredById !== primary.id ? secondary.referredById : ""),
    notes,
    lastContactedAt:
      primary.lastContactedAt > secondary.lastContactedAt
        ? primary.lastContactedAt
        : secondary.lastContactedAt,
    createdAt: primary.createdAt < secondary.createdAt ? primary.createdAt : secondary.createdAt,
    updatedAt: now,
  };
}
