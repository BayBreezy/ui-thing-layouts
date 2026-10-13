import { displayName } from "./contacts";
import type { Contact } from "./types";

const escape = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\;").replace(/,/g, "\\,");
const type = (label: string) => (label === "mobile" ? "CELL" : label.toUpperCase());

/** vCard 3.0 for one contact, which every address book app can import. */
export function contactToVCard(contact: Contact) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(contact.lastName)};${escape(contact.firstName)};;;`,
    `FN:${escape(displayName(contact))}`,
  ];
  if (contact.nickname) lines.push(`NICKNAME:${escape(contact.nickname)}`);
  if (contact.company) lines.push(`ORG:${escape(contact.company)}`);
  if (contact.jobTitle) lines.push(`TITLE:${escape(contact.jobTitle)}`);
  for (const email of contact.emails)
    lines.push(`EMAIL;TYPE=${type(email.label)}:${escape(email.value)}`);
  for (const phone of contact.phones)
    lines.push(`TEL;TYPE=${type(phone.label)}:${escape(phone.value)}`);
  for (const address of contact.addresses)
    lines.push(
      `ADR;TYPE=${type(address.label)}:;;${[
        address.street,
        address.city,
        address.region,
        address.postal,
        address.country,
      ]
        .map(escape)
        .join(";")}`
    );
  for (const website of contact.websites) lines.push(`URL:${escape(website)}`);
  if (contact.birthday) lines.push(`BDAY:${contact.birthday}`);
  if (contact.labels.length) lines.push(`CATEGORIES:${contact.labels.map(escape).join(",")}`);
  if (contact.notes) lines.push(`NOTE:${escape(contact.notes)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
export const contactsToVCard = (contacts: Contact[]) =>
  contacts.map(contactToVCard).join("\r\n") + "\r\n";
