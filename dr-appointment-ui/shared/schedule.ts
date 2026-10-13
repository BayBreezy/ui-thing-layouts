import type {
  Appointment,
  AppointmentStatus,
  DayAvailability,
  Provider,
  ScheduleContext,
  SlimAppointment,
  Slot,
  Urgency,
  VisitType,
  WaitlistEntry,
  WorkingDay,
} from "./types";
import { referenceDate, referenceTime } from "./types";

/* Clinic-local time. Dates are `YYYY-MM-DD` and times are `HH:mm`; nothing here touches the
 * viewer's time zone, so the server and every browser agree on what "9:30" means. */

export const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
export const fromMinutes = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
export const addMinutes = (time: string, minutes: number) => fromMinutes(toMinutes(time) + minutes);

const dayMs = 86_400_000;
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(date + "T00:00:00Z") + days * dayMs).toISOString().slice(0, 10);
/** 0 is Sunday. */
export const weekdayOf = (date: string) => new Date(date + "T00:00:00Z").getUTCDay();
/** The Monday on or before the date. */
export const startOfWeek = (date: string) => addDays(date, -((weekdayOf(date) + 6) % 7));
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / dayMs);
export const isValidDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
export const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

/** Cancelled and no-show visits free their slot; everything else holds it. */
export const holdsSlot = (status: AppointmentStatus) =>
  status !== "cancelled" && status !== "no-show";

const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["confirmed", "checked-in", "cancelled", "no-show"],
  confirmed: ["checked-in", "cancelled", "no-show"],
  "checked-in": ["in-progress", "cancelled"],
  "in-progress": ["completed"],
  completed: [],
  cancelled: ["scheduled"],
  "no-show": ["scheduled"],
};
export const allowedTransitions = (status: AppointmentStatus) => transitions[status];
export const canTransition = (from: AppointmentStatus, to: AppointmentStatus) =>
  transitions[from].includes(to);
/** Moving a visit back onto the schedule means it needs its slot again. */
export const needsSlot = (from: AppointmentStatus, to: AppointmentStatus) =>
  !holdsSlot(from) && holdsSlot(to);

/** The provider's working window for the date, or `null` if they are not working. */
export function workingDay(provider: Provider, date: string): WorkingDay | null {
  if (!provider.active || provider.daysOff.includes(date)) return null;
  return provider.hours[weekdayOf(date)] ?? null;
}
export function fitsWorkingHours(provider: Provider, date: string, start: string, end: string) {
  const day = workingDay(provider, date);
  if (!day) return false;
  if (toMinutes(start) < toMinutes(day.start) || toMinutes(end) > toMinutes(day.end)) return false;
  if (day.breakStart && day.breakEnd && overlaps(start, end, day.breakStart, day.breakEnd))
    return false;
  return true;
}

export type Conflict = { kind: "provider" | "patient"; appointment: SlimAppointment };
/** The first held visit that overlaps the candidate for the same provider or the same patient. */
export function findConflict(
  appointments: SlimAppointment[],
  candidate: Pick<Appointment, "id" | "patientId" | "providerId" | "date" | "start" | "end">
): Conflict | null {
  for (const item of appointments) {
    if (item.id === candidate.id || item.date !== candidate.date || !holdsSlot(item.status))
      continue;
    if (!overlaps(candidate.start, candidate.end, item.start, item.end)) continue;
    if (item.providerId === candidate.providerId) return { kind: "provider", appointment: item };
    if (item.patientId === candidate.patientId) return { kind: "patient", appointment: item };
  }
  return null;
}

export const slim = (item: Appointment): SlimAppointment => ({
  id: item.id,
  patientId: item.patientId,
  providerId: item.providerId,
  date: item.date,
  start: item.start,
  end: item.end,
  status: item.status,
});

/** Every reason a booking cannot be made. An empty list means it is valid. */
export function bookingProblems(
  candidate: Pick<
    Appointment,
    "id" | "patientId" | "providerId" | "visitTypeId" | "date" | "start" | "end" | "status"
  >,
  context: ScheduleContext,
  options: { checkPast?: boolean } = {}
): string[] {
  const problems: string[] = [];
  const provider = context.providers.find((item) => item.id === candidate.providerId);
  const visit = context.visitTypes.find((item) => item.id === candidate.visitTypeId);
  if (!provider) return ["Choose a provider."];
  if (!visit) return ["Choose a visit type."];
  if (!context.patientIds.includes(candidate.patientId)) return ["Choose a patient."];
  if (toMinutes(candidate.end) - toMinutes(candidate.start) !== visit.minutes)
    problems.push(`This visit takes ${visit.minutes} minutes.`);
  if (!provider.visitTypeIds.includes(visit.id))
    problems.push(`${provider.name} does not offer this visit type.`);
  if (!holdsSlot(candidate.status)) return problems;
  if (options.checkPast && isInPast(candidate.date, candidate.start))
    problems.push("That time has already passed.");
  if (!workingDay(provider, candidate.date))
    problems.push(`${provider.name} is not working on this day.`);
  else if (!fitsWorkingHours(provider, candidate.date, candidate.start, candidate.end))
    problems.push(`That time is outside ${provider.name}'s working hours.`);
  const day = workingDay(provider, candidate.date);
  if (
    day &&
    context.slotMinutes > 0 &&
    (toMinutes(candidate.start) - toMinutes(day.start)) % context.slotMinutes !== 0
  )
    problems.push(`Start times follow ${context.slotMinutes}-minute slots.`);
  const conflict = findConflict(context.appointments, candidate);
  if (conflict?.kind === "provider")
    problems.push(
      `${provider.name} already has a visit from ${conflict.appointment.start} to ${conflict.appointment.end}.`
    );
  if (conflict?.kind === "patient")
    problems.push(
      `This patient already has a visit from ${conflict.appointment.start} to ${conflict.appointment.end}.`
    );
  return problems;
}

/** Start times that are open for one provider and one visit length on one day. */
export function openStarts(options: {
  provider: Provider;
  minutes: number;
  date: string;
  appointments: SlimAppointment[];
  slotMinutes: number;
  /** A visit being rescheduled does not block its own slot. */
  ignoreId?: string;
  /** Hide times that have already passed on the demo day. */
  afterNow?: boolean;
}): string[] {
  const { provider, minutes, date, appointments, slotMinutes, ignoreId } = options;
  const day = workingDay(provider, date);
  if (!day || slotMinutes <= 0) return [];
  const held = appointments.filter(
    (item) =>
      item.providerId === provider.id &&
      item.date === date &&
      item.id !== ignoreId &&
      holdsSlot(item.status)
  );
  const result: string[] = [];
  const close = toMinutes(day.end);
  for (let cursor = toMinutes(day.start); cursor + minutes <= close; cursor += slotMinutes) {
    const start = fromMinutes(cursor);
    const end = fromMinutes(cursor + minutes);
    if (options.afterNow !== false && isInPast(date, start)) continue;
    if (day.breakStart && day.breakEnd && overlaps(start, end, day.breakStart, day.breakEnd))
      continue;
    if (held.some((item) => overlaps(start, end, item.start, item.end))) continue;
    result.push(start);
  }
  return result;
}

/** Has this moment already happened on the demo clock? */
export const isInPast = (date: string, time: string) =>
  date < referenceDate || (date === referenceDate && toMinutes(time) <= toMinutes(referenceTime));

/**
 * Open slots for a visit type over a run of days, across one provider or all that offer it.
 * Providers are tried in the order given, so the result is stable.
 */
export function availability(options: {
  visitType: Pick<VisitType, "id" | "minutes">;
  providerId: string;
  from: string;
  days: number;
  context: ScheduleContext;
  ignoreId?: string;
}): DayAvailability[] {
  const { visitType, providerId, from, days, context } = options;
  const providers = context.providers.filter(
    (item) =>
      item.active &&
      item.visitTypeIds.includes(visitType.id) &&
      (!providerId || item.id === providerId)
  );
  const result: DayAvailability[] = [];
  for (let offset = 0; offset < days; offset++) {
    const date = addDays(from, offset);
    const slots: Slot[] = [];
    for (const provider of providers)
      for (const start of openStarts({
        provider,
        minutes: visitType.minutes,
        date,
        appointments: context.appointments,
        slotMinutes: context.slotMinutes,
        ignoreId: options.ignoreId,
      }))
        slots.push({ providerId: provider.id, start });
    slots.sort(
      (a, b) => a.start.localeCompare(b.start) || a.providerId.localeCompare(b.providerId)
    );
    result.push({ date, slots });
  }
  return result;
}

/** The earliest open slot, or `null` if nothing is free in the window. */
export function firstAvailable(
  options: Parameters<typeof availability>[0]
): (Slot & { date: string }) | null {
  for (const day of availability(options)) {
    const slot = day.slots[0];
    if (slot) return { ...slot, date: day.date };
  }
  return null;
}

const urgencyRank: Record<Urgency, number> = { urgent: 0, soon: 1, routine: 2 };
/** Waitlisted patients who could take a freed visit, most urgent and longest-waiting first. */
export function matchingWaitlist(
  waitlist: WaitlistEntry[],
  freed: Pick<Appointment, "providerId" | "visitTypeId" | "date" | "patientId">
) {
  return waitlist
    .filter(
      (entry) =>
        entry.visitTypeId === freed.visitTypeId &&
        (!entry.providerId || entry.providerId === freed.providerId) &&
        (!entry.earliest || entry.earliest <= freed.date) &&
        entry.patientId !== freed.patientId
    )
    .sort(
      (a, b) =>
        urgencyRank[a.urgency] - urgencyRank[b.urgency] || a.createdAt.localeCompare(b.createdAt)
    );
}

/** Booked share of a provider's open minutes across a run of dates (0 to 1). */
export function utilization(
  provider: Provider,
  appointments: SlimAppointment[],
  from: string,
  days: number
) {
  let open = 0;
  let booked = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = addDays(from, offset);
    const day = workingDay(provider, date);
    if (!day) continue;
    const breakMinutes =
      day.breakStart && day.breakEnd ? toMinutes(day.breakEnd) - toMinutes(day.breakStart) : 0;
    open += toMinutes(day.end) - toMinutes(day.start) - breakMinutes;
    for (const item of appointments)
      if (item.providerId === provider.id && item.date === date && holdsSlot(item.status))
        booked += toMinutes(item.end) - toMinutes(item.start);
  }
  return open === 0 ? 0 : Math.min(1, booked / open);
}

/** A short, stable, human-friendly code derived from the record id. */
export function referenceFor(id: string) {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += alphabet[hash % alphabet.length];
    hash = Math.floor(hash / alphabet.length) + Math.imul(hash, 31);
    hash >>>= 0;
  }
  return "MND-" + code;
}
