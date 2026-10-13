import { formatTime } from "./format";
import { fullName } from "./patients";
import type { Appointment, Patient, Provider, VisitType } from "./types";

/** Spreadsheets run cells that start with these characters as formulas. */
const dangerous = /^[=+\-@\t\r]/;
export function csvCell(value: string | number | boolean) {
  let text = String(value);
  if (dangerous.test(text)) text = "'" + text;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
const toCsv = (rows: (string | number | boolean)[][]) =>
  rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";

export function appointmentsCsv(
  appointments: Appointment[],
  lookups: { patients: Patient[]; providers: Provider[]; visitTypes: VisitType[] }
) {
  const patients = new Map(lookups.patients.map((item) => [item.id, item]));
  const providers = new Map(lookups.providers.map((item) => [item.id, item]));
  const visits = new Map(lookups.visitTypes.map((item) => [item.id, item]));
  return toCsv([
    [
      "Reference",
      "Date",
      "Start",
      "End",
      "Patient",
      "Provider",
      "Visit type",
      "Status",
      "Source",
      "Reason",
    ],
    ...appointments.map((item) => {
      const patient = patients.get(item.patientId);
      return [
        item.reference,
        item.date,
        formatTime(item.start, "24h"),
        formatTime(item.end, "24h"),
        patient ? fullName(patient) : "",
        providers.get(item.providerId)?.name ?? "",
        visits.get(item.visitTypeId)?.name ?? "",
        item.status,
        item.source,
        item.reason,
      ];
    }),
  ]);
}
export function patientsCsv(patients: Patient[], providers: Provider[]) {
  const names = new Map(providers.map((item) => [item.id, item.name]));
  return toCsv([
    [
      "First name",
      "Last name",
      "Email",
      "Phone",
      "Birthday",
      "Insurance",
      "Preferred provider",
      "Tags",
    ],
    ...patients.map((item) => [
      item.firstName,
      item.lastName,
      item.email,
      item.phone,
      item.birthday,
      item.insurance,
      names.get(item.preferredProviderId) ?? "",
      item.tags.join("; "),
    ]),
  ]);
}
