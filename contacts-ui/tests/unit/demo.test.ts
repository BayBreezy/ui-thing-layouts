import { describe, expect, it } from "vitest";

import { groupIconNames } from "../../app/utils/demo";
import { restoreSnapshot } from "../../app/utils/persistence";
import { createDemoState } from "../../server/utils/fixtures";
import {
  addDays,
  displayName,
  hueFor,
  initials,
  isOverdue,
  matchesSearch,
  missingFields,
  nextBirthday,
  normalizePhone,
} from "../../shared/contacts";
import {
  contactsFromCsv,
  contactsToCsv,
  maxImportRows,
  neutralize,
  parseCsv,
  toCsv,
} from "../../shared/csv";
import { assertRelationships } from "../../shared/demo";
import { findDuplicates, mergeContacts } from "../../shared/duplicates";
import { contactSchema, demoStateSchema } from "../../shared/schemas";
import { groupIcons, referenceDate } from "../../shared/types";
import { contactToVCard } from "../../shared/vcard";

const seed = createDemoState();
const stamp = "2026-10-12T12:00:00.000Z";
const context = (emails: string[] = []) => ({
  groups: seed.groups.map((group) => ({ id: group.id, name: group.name })),
  emails,
  makeId: (() => {
    let index = 0;
    return () => `import-${++index}`;
  })(),
  now: stamp,
});

describe("seed data", () => {
  it("is deterministic and valid", () => {
    expect(JSON.stringify(createDemoState())).toBe(JSON.stringify(seed));
    expect(() => demoStateSchema.validateSync(seed, { strict: true })).not.toThrow();
    expect(() => assertRelationships(seed)).not.toThrow();
  });
  it("is populated enough to demonstrate every feature", () => {
    expect(seed.contacts.length).toBeGreaterThanOrEqual(50);
    expect(seed.groups).toHaveLength(7);
    expect(seed.contacts.some((item) => item.archived)).toBe(true);
    expect(seed.contacts.some((item) => item.favorite)).toBe(true);
    expect(seed.contacts.some((item) => item.referredById)).toBe(true);
    expect(seed.followUps.some((item) => isOverdue(item, referenceDate))).toBe(true);
    expect(seed.followUps.some((item) => item.done)).toBe(true);
    expect(seed.contacts.some((item) => missingFields(item).includes("email"))).toBe(true);
  });
  it("plants one duplicate of each kind", () => {
    const reasons = findDuplicates(seed.contacts)
      .map((pair) => pair.reason)
      .sort();
    expect(reasons).toEqual(["email", "name", "phone"]);
  });
  it("never leaks faker into shared code", () => {
    expect(Object.keys(seed.contacts[0]!)).not.toContain("faker");
  });
});

describe("group icons", () => {
  it("has a literal icon name for every choice, so the picker and cards can render it", () => {
    expect(groupIcons.length).toBeGreaterThanOrEqual(24);
    expect(Object.keys(groupIconNames).sort()).toEqual([...groupIcons].sort());
    for (const name of Object.values(groupIconNames)) expect(name).toMatch(/^lucide:[a-z0-9-]+$/);
    expect(seed.groups.every((group) => groupIcons.includes(group.icon))).toBe(true);
  });
});

describe("relationships and persistence", () => {
  it("rejects dangling ids and duplicate records", () => {
    const dangling = structuredClone(seed);
    dangling.contacts[0]!.groupIds = ["missing"];
    expect(() => assertRelationships(dangling)).toThrow("Unknown contact relationship");
    const orphan = structuredClone(seed);
    orphan.interactions[0]!.contactId = "missing";
    expect(() => assertRelationships(orphan)).toThrow("Unknown contact reference");
    const repeated = structuredClone(seed);
    repeated.contacts.push(structuredClone(repeated.contacts[0]!));
    expect(() => assertRelationships(repeated)).toThrow("Duplicate record ID");
  });
  it("restores valid snapshots and refuses corrupt ones", () => {
    expect(restoreSnapshot(null)).toBeNull();
    expect(restoreSnapshot(JSON.stringify(seed))?.contacts).toHaveLength(seed.contacts.length);
    expect(() => restoreSnapshot("{not json")).toThrow();
    expect(() => restoreSnapshot(JSON.stringify({ ...seed, version: 2 }))).toThrow();
    const broken = structuredClone(seed);
    broken.followUps[0]!.contactId = "gone";
    expect(() => restoreSnapshot(JSON.stringify(broken))).toThrow();
  });
  it("validates contact fields", () => {
    const base = seed.contacts[0]!;
    expect(contactSchema.isValidSync(base)).toBe(true);
    expect(contactSchema.isValidSync({ ...base, birthday: "2026-13-40" })).toBe(false);
    expect(
      contactSchema.isValidSync({
        ...base,
        emails: [{ label: "work", value: "not-an-email", primary: true }],
      })
    ).toBe(false);
    expect(
      contactSchema.isValidSync({ ...base, firstName: "", lastName: "", company: "", nickname: "" })
    ).toBe(false);
    expect(
      contactSchema.isValidSync({
        ...base,
        phones: [{ label: "mobile", value: "call me maybe", primary: true }],
      })
    ).toBe(false);
  });
});

describe("contact helpers", () => {
  it("builds display names, initials and stable hues", () => {
    const person = { firstName: "Ada", lastName: "Lovelace", nickname: "", company: "" };
    expect(displayName(person)).toBe("Ada Lovelace");
    expect(displayName(person, "last-first")).toBe("Lovelace, Ada");
    expect(displayName({ ...person, firstName: "", lastName: "", company: "Acme" })).toBe("Acme");
    expect(displayName({ ...person, firstName: "", lastName: "" })).toBe("Unnamed contact");
    expect(initials(person)).toBe("AL");
    expect(hueFor("Ada Lovelace")).toBe(hueFor("Ada Lovelace"));
    expect(hueFor("Ada Lovelace")).toBeLessThan(360);
  });
  it("searches every word across names, company, email and labels", () => {
    const contact = seed.contacts[0]!;
    expect(matchesSearch(contact, "")).toBe(true);
    expect(matchesSearch(contact, contact.firstName.toLowerCase())).toBe(true);
    expect(matchesSearch(contact, `${contact.firstName} ${contact.company}`)).toBe(true);
    expect(matchesSearch(contact, "zzzz-not-here")).toBe(false);
  });
  it("finds the next birthday, rolling to next year and handling leap days", () => {
    expect(nextBirthday("", referenceDate)).toBeNull();
    expect(nextBirthday("1990-10-14", "2026-10-12")).toEqual({ date: "2026-10-14", days: 2 });
    expect(nextBirthday("1990-10-12", "2026-10-12")).toEqual({ date: "2026-10-12", days: 0 });
    expect(nextBirthday("1990-10-11", "2026-10-12")?.date).toBe("2027-10-11");
    expect(nextBirthday("1992-02-29", "2026-10-12")?.date).toBe("2027-03-01");
  });
  it("does date arithmetic and phone normalization in UTC", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(normalizePhone("+1 (555) 555-0123")).toBe("5555550123");
  });
});

describe("duplicates and merging", () => {
  it("merges without losing data or repeating values", () => {
    const [pair] = findDuplicates(seed.contacts).filter((item) => item.reason === "email");
    const merged = mergeContacts(pair!.a, pair!.b, stamp);
    expect(merged.id).toBe(pair!.a.id);
    expect(merged.emails).toHaveLength(1);
    expect(merged.groupIds).toEqual([...new Set([...pair!.a.groupIds, ...pair!.b.groupIds])]);
    expect(merged.updatedAt).toBe(stamp);
    expect(contactSchema.isValidSync(merged)).toBe(true);
  });
  it("lets the primary win and fills gaps from the other", () => {
    const [a, b] = [seed.contacts[0]!, seed.contacts[1]!];
    const sparse = { ...a, jobTitle: "", notes: "", favorite: false };
    const full = { ...b, jobTitle: "Chief of Staff", notes: "Prefers mornings", favorite: true };
    const merged = mergeContacts(sparse, full, stamp);
    expect(merged.firstName).toBe(a.firstName);
    expect(merged.jobTitle).toBe("Chief of Staff");
    expect(merged.notes).toBe("Prefers mornings");
    expect(merged.favorite).toBe(true);
    expect(merged.emails.length).toBe(
      new Set([...a.emails, ...b.emails].map((e) => e.value.toLowerCase())).size
    );
  });
  it("ignores archived contacts and short keys", () => {
    const contacts = structuredClone(seed.contacts.slice(0, 2));
    contacts[1]!.emails = structuredClone(contacts[0]!.emails);
    expect(findDuplicates(contacts)).toHaveLength(1);
    contacts[1]!.archived = true;
    expect(findDuplicates(contacts)).toHaveLength(0);
  });
});

describe("CSV and vCard", () => {
  it("neutralizes spreadsheet formulas but keeps normal text", () => {
    expect(neutralize("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(neutralize("+1 555 555 0100")).toBe("'+1 555 555 0100");
    expect(neutralize("Ada")).toBe("Ada");
    expect(toCsv([["=HYPERLINK(1)", 'say "hi", ok']])).toBe(`'=HYPERLINK(1),"say ""hi"", ok"`);
  });
  it("parses quotes, embedded newlines, CRLF and a BOM", () => {
    const rows = parseCsv('﻿a,b\r\n"1,5","line\none"\r\n"he said ""no""",x\n');
    expect(rows).toEqual([
      ["a", "b"],
      ["1,5", "line\none"],
      ['he said "no"', "x"],
    ]);
  });
  it("round-trips an export through the importer", () => {
    const contacts = seed.contacts.filter((item) => !item.archived).slice(0, 12);
    const result = contactsFromCsv(contactsToCsv(contacts, seed.groups), context());
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(contacts.length);
    const first = result.rows[0]!.contact;
    expect(first.firstName).toBe(contacts[0]!.firstName);
    expect(first.emails.map((e) => e.value)).toEqual(contacts[0]!.emails.map((e) => e.value));
    expect(first.phones.map((e) => e.value)).toEqual(contacts[0]!.phones.map((e) => e.value));
    expect(first.groupIds.sort()).toEqual([...contacts[0]!.groupIds].sort());
    expect(first.source).toBe("import");
  });
  it("reports bad rows, duplicates and unknown groups", () => {
    const csv = [
      "first_name,last_name,email,groups",
      "Ada,Lovelace,ada@example.com,Clients; Chess club",
      "Bad,Row,not-an-email,",
      "Dup,Licate,exists@example.com,",
      "Twin,Ada,ADA@example.com,",
    ].join("\n");
    const result = contactsFromCsv(csv, context(["exists@example.com"]));
    expect(result.total).toBe(4);
    expect(result.rows.map((row) => row.line)).toEqual([2, 4]);
    expect(result.rows[0]!.contact.groupIds).toEqual(["group-3"]);
    expect(result.rows[0]!.contact.labels).toEqual(["Chess club"]);
    expect(result.rows[1]!.duplicateOf).toBe("exists@example.com");
    expect(result.errors.map((error) => error.line)).toEqual([3, 5]);
  });
  it("undoes neutralization on import and rejects unusable files", () => {
    const csv = "first_name,phone\nAda,'+1 555 555 0100";
    expect(contactsFromCsv(csv, context()).rows[0]!.contact.phones[0]!.value).toBe(
      "+1 555 555 0100"
    );
    expect(contactsFromCsv("", context()).errors[0]!.message).toContain("empty");
    expect(contactsFromCsv("foo,bar\n1,2", context()).errors[0]!.message).toContain("header");
    const many = "first_name\n" + Array.from({ length: maxImportRows + 1 }, () => "Ada").join("\n");
    expect(contactsFromCsv(many, context()).errors[0]!.message).toContain(String(maxImportRows));
  });
  it("writes a valid vCard with escaped separators", () => {
    const card = contactToVCard({
      ...seed.contacts[0]!,
      firstName: "Ada",
      lastName: "Lovelace",
      notes: "Line one\nLine two; with, punctuation",
    });
    expect(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true);
    expect(card).toContain("N:Lovelace;Ada;;;");
    expect(card).toContain("NOTE:Line one\\nLine two\\; with\\, punctuation");
    expect(card.endsWith("END:VCARD")).toBe(true);
  });
});
