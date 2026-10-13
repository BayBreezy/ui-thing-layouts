import { daysBetween } from "./schedule";
import type { Patient } from "./types";

export const fullName = (patient: Pick<Patient, "firstName" | "lastName">) =>
  `${patient.firstName} ${patient.lastName}`.trim();
export const initialsOf = (name: string) =>
  name
    .replace(/^(Dr|NP|PA)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
/** A stable avatar hue from any string. */
export function hueFor(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}
export const ageOn = (birthday: string, date: string) => {
  if (!birthday) return null;
  const years = Math.floor(daysBetween(birthday, date) / 365.2425);
  return years >= 0 ? years : null;
};
export const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "");

/** Every word of the query must match somewhere in the name, email, phone, tags or insurance. */
export function searchPatients(patients: Patient[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return patients;
  return patients.filter((patient) => {
    const haystack = [
      fullName(patient),
      patient.email,
      normalizePhone(patient.phone),
      patient.phone,
      patient.insurance,
      ...patient.tags,
    ]
      .join(" ")
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
