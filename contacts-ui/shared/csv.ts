import { displayName, hueFor, normalizeEmail } from "./contacts";
import { contactSchema } from "./schemas";
import type { Contact, Group, ImportError, ImportResult, ImportRow, Relationship } from "./types";
import { relationships } from "./types";

export const maxImportRows = 500;
const formulaPrefix = /^[=+\-@\t\r]/;

/**
 * Spreadsheets run cells that start with `=`, `+`, `-` or `@` as formulas. Prefixing an apostrophe
 * keeps exported data inert; `unneutralize` removes it again on import.
 */
export const neutralize = (cell: string) => (formulaPrefix.test(cell) ? `'${cell}` : cell);
export const unneutralize = (cell: string) => (/^'[=+\-@]/.test(cell) ? cell.slice(1) : cell);

const quote = (cell: string) => (/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
export function toCsv(rows: (string | number | boolean)[][]) {
  return rows
    .map((row) => row.map((cell) => quote(neutralize(String(cell)))).join(","))
    .join("\r\n");
}

/** A small RFC 4180 parser: quoted fields, escaped quotes, CRLF or LF, optional BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = (text.split(/\r?\n/, 1)[0] ?? "").includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === delimiter) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

export const exportColumns = [
  "first_name",
  "last_name",
  "nickname",
  "company",
  "job_title",
  "email",
  "phone",
  "city",
  "region",
  "country",
  "website",
  "birthday",
  "groups",
  "labels",
  "relationship",
  "favorite",
  "notes",
] as const;
type Column = (typeof exportColumns)[number];

const aliases: Record<Column, string[]> = {
  first_name: ["first name", "firstname", "first", "given name", "given"],
  last_name: ["last name", "lastname", "last", "surname", "family name"],
  nickname: ["nickname", "nick name"],
  company: ["company", "organization", "organisation", "employer"],
  job_title: ["job title", "jobtitle", "title", "position", "role"],
  email: ["email", "e-mail", "email address", "emails"],
  phone: ["phone", "phone number", "mobile", "telephone", "tel", "phones"],
  city: ["city", "town"],
  region: ["region", "state", "province"],
  country: ["country"],
  website: ["website", "url", "web"],
  birthday: ["birthday", "birthdate", "date of birth", "dob"],
  groups: ["groups", "group", "lists"],
  labels: ["labels", "label", "tags", "tag"],
  relationship: ["relationship", "relation"],
  favorite: ["favorite", "favourite", "starred"],
  notes: ["notes", "note", "comments"],
};
const headerKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ");

export function contactsToCsv(contacts: Contact[], groups: Group[]) {
  const names = new Map(groups.map((group) => [group.id, group.name]));
  const rows = contacts.map((contact) => {
    const address = contact.addresses[0];
    return [
      contact.firstName,
      contact.lastName,
      contact.nickname,
      contact.company,
      contact.jobTitle,
      contact.emails.map((item) => item.value).join("; "),
      contact.phones.map((item) => item.value).join("; "),
      address?.city ?? "",
      address?.region ?? "",
      address?.country ?? "",
      contact.websites[0] ?? "",
      contact.birthday,
      contact.groupIds
        .map((id) => names.get(id) ?? "")
        .filter(Boolean)
        .join("; "),
      contact.labels.join("; "),
      contact.relationship,
      contact.favorite ? "yes" : "no",
      contact.notes,
    ];
  });
  return toCsv([[...exportColumns], ...rows]);
}

export interface ImportContext {
  groups: { id: string; name: string }[];
  /** Emails of contacts that already exist, used to flag duplicates. */
  emails: string[];
  makeId?: () => string;
  now?: string;
}
const list = (value: string) =>
  value
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);

/** Turns CSV text into validated contacts plus per-row errors. Pure, so it runs on the server and in tests. */
export function contactsFromCsv(csv: string, context: ImportContext): ImportResult {
  const makeId = context.makeId ?? (() => crypto.randomUUID());
  const now = context.now ?? new Date().toISOString();
  const rows = parseCsv(csv);
  const errors: ImportError[] = [];
  const result: ImportRow[] = [];
  const header = rows[0];
  if (!header) return { rows: [], errors: [{ line: 1, message: "The file is empty." }], total: 0 };
  const index = new Map<Column, number>();
  header.forEach((name, position) => {
    const key = headerKey(name);
    for (const column of exportColumns) {
      if (!index.has(column) && (key === headerKey(column) || aliases[column].includes(key)))
        index.set(column, position);
    }
  });
  if (
    !index.has("first_name") &&
    !index.has("last_name") &&
    !index.has("company") &&
    !index.has("email")
  ) {
    return {
      rows: [],
      errors: [
        {
          line: 1,
          message:
            "Add a header row with columns such as first_name, last_name, company and email.",
        },
      ],
      total: 0,
    };
  }
  const data = rows.slice(1);
  if (data.length > maxImportRows)
    return {
      rows: [],
      errors: [{ line: 1, message: `Import up to ${maxImportRows} rows at a time.` }],
      total: data.length,
    };
  const known = new Map(context.emails.map((email) => [normalizeEmail(email), email]));
  const groupIds = new Map(context.groups.map((group) => [group.name.toLowerCase(), group.id]));
  const seen = new Set<string>();
  data.forEach((cells, position) => {
    const line = position + 2;
    const get = (column: Column) => unneutralize((cells[index.get(column) ?? -1] ?? "").trim());
    const labels: string[] = [];
    const ids: string[] = [];
    for (const name of list(get("groups"))) {
      const id = groupIds.get(name.toLowerCase());
      if (id) ids.push(id);
      // A group that does not exist yet is kept as a label rather than silently dropped.
      else labels.push(name);
    }
    for (const label of list(get("labels"))) if (!labels.includes(label)) labels.push(label);
    const relationship = get("relationship").toLowerCase() as Relationship;
    const emails = list(get("email").replace(/,/g, ";"));
    const phones = list(get("phone"));
    const contact: Contact = {
      id: makeId(),
      firstName: get("first_name"),
      lastName: get("last_name"),
      nickname: get("nickname"),
      company: get("company"),
      jobTitle: get("job_title"),
      emails: emails.map((value, order) => ({ label: "work", value, primary: order === 0 })),
      phones: phones.map((value, order) => ({ label: "mobile", value, primary: order === 0 })),
      addresses:
        get("city") || get("region") || get("country")
          ? [
              {
                label: "home",
                street: "",
                city: get("city"),
                region: get("region"),
                postal: "",
                country: get("country"),
              },
            ]
          : [],
      websites: get("website") ? [get("website")] : [],
      socials: { linkedin: "", x: "", github: "", instagram: "" },
      birthday: get("birthday"),
      groupIds: [...new Set(ids)],
      labels,
      relationship: relationships.includes(relationship) ? relationship : "acquaintance",
      favorite: ["yes", "true", "1", "y"].includes(get("favorite").toLowerCase()),
      archived: false,
      referredById: "",
      avatarHue: 0,
      notes: get("notes"),
      source: "import",
      lastContactedAt: "",
      createdAt: now,
      updatedAt: now,
    };
    contact.avatarHue = hueFor(displayName(contact));
    try {
      contactSchema.validateSync(contact, { abortEarly: false });
    } catch (cause) {
      const messages = (cause as { errors?: string[] }).errors ?? ["This row is not valid."];
      errors.push({ line, message: messages.join(". ") });
      return;
    }
    const email = contact.emails[0] ? normalizeEmail(contact.emails[0].value) : "";
    if (email && seen.has(email)) {
      errors.push({ line, message: "Repeats an email address earlier in this file." });
      return;
    }
    if (email) seen.add(email);
    result.push({ line, contact, duplicateOf: "" });
    const existing = email ? known.get(email) : undefined;
    if (existing) result[result.length - 1]!.duplicateOf = existing;
  });
  return { rows: result, errors, total: data.length };
}
