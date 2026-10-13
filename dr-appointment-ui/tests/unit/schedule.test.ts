import { describe, expect, it } from "vitest";

import { appointmentsCsv, csvCell, patientsCsv } from "../../shared/csv";
import { formatDate, formatDuration, formatRange, formatTime } from "../../shared/format";
import { ageOn, hueFor, initialsOf, searchPatients } from "../../shared/patients";
import {
  addDays,
  allowedTransitions,
  availability,
  bookingProblems,
  canTransition,
  findConflict,
  firstAvailable,
  fitsWorkingHours,
  holdsSlot,
  isInPast,
  matchingWaitlist,
  needsSlot,
  openStarts,
  overlaps,
  referenceFor,
  startOfWeek,
  toMinutes,
  utilization,
  weekdayOf,
  workingDay,
} from "../../shared/schedule";
import type {
  Appointment,
  Patient,
  Provider,
  ScheduleContext,
  SlimAppointment,
  WaitlistEntry,
} from "../../shared/types";

const day = { start: "09:00", end: "17:00", breakStart: "12:00", breakEnd: "13:00" };
const provider: Provider = {
  id: "p1",
  name: "Dr. Test",
  title: "MD",
  specialty: "Family medicine",
  room: "Room 1",
  hue: 10,
  // Sunday and Saturday off, weekdays 9 to 5 with a lunch break.
  hours: [null, day, day, day, day, day, null],
  daysOff: ["2026-10-21"],
  visitTypeIds: ["short", "long"],
  acceptingNew: true,
  active: true,
  bio: "",
};
const visits = [
  { id: "short", minutes: 20 },
  { id: "long", minutes: 45 },
];
// 2026-10-14 is a Wednesday and is after the demo "today" (2026-10-13).
const wednesday = "2026-10-14";
const item = (over: Partial<SlimAppointment>): SlimAppointment => ({
  id: "a1",
  patientId: "pat1",
  providerId: "p1",
  date: wednesday,
  start: "10:00",
  end: "10:20",
  status: "confirmed",
  ...over,
});
const context = (appointments: SlimAppointment[] = []): ScheduleContext => ({
  providers: [provider],
  visitTypes: visits,
  patientIds: ["pat1", "pat2"],
  slotMinutes: 15,
  appointments,
});
const candidate = (over: Partial<Appointment> = {}) => ({
  id: "new",
  patientId: "pat2",
  providerId: "p1",
  visitTypeId: "short",
  date: wednesday,
  start: "10:00",
  end: "10:20",
  status: "scheduled" as const,
  ...over,
});

describe("clinic-local dates and times", () => {
  it("does arithmetic without time zones", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(weekdayOf("2026-10-13")).toBe(2);
    expect(startOfWeek("2026-10-18")).toBe("2026-10-12");
    expect(startOfWeek("2026-10-12")).toBe("2026-10-12");
  });
  it("knows what has already happened on the demo clock", () => {
    expect(isInPast("2026-10-12", "17:00")).toBe(true);
    expect(isInPast("2026-10-13", "10:40")).toBe(true);
    expect(isInPast("2026-10-13", "10:45")).toBe(false);
    expect(isInPast("2026-10-14", "08:00")).toBe(false);
  });
  it("treats touching visits as not overlapping", () => {
    expect(overlaps("09:00", "09:20", "09:20", "09:40")).toBe(false);
    expect(overlaps("09:00", "09:20", "09:19", "09:40")).toBe(true);
    expect(overlaps("09:00", "10:00", "09:15", "09:30")).toBe(true);
  });
});

describe("working hours", () => {
  it("honours weekdays, days off and inactive providers", () => {
    expect(workingDay(provider, wednesday)).not.toBeNull();
    expect(workingDay(provider, "2026-10-17")).toBeNull(); // Saturday
    expect(workingDay(provider, "2026-10-21")).toBeNull(); // day off
    expect(workingDay({ ...provider, active: false }, wednesday)).toBeNull();
  });
  it("rejects visits outside hours or across the break", () => {
    expect(fitsWorkingHours(provider, wednesday, "09:00", "09:20")).toBe(true);
    expect(fitsWorkingHours(provider, wednesday, "08:45", "09:05")).toBe(false);
    expect(fitsWorkingHours(provider, wednesday, "16:45", "17:05")).toBe(false);
    expect(fitsWorkingHours(provider, wednesday, "11:50", "12:10")).toBe(false);
    expect(fitsWorkingHours(provider, wednesday, "12:00", "12:20")).toBe(false);
    expect(fitsWorkingHours(provider, wednesday, "13:00", "13:20")).toBe(true);
    expect(fitsWorkingHours(provider, wednesday, "16:40", "17:00")).toBe(true);
  });
});

describe("open starts", () => {
  const starts = (appointments: SlimAppointment[] = [], extra = {}) =>
    openStarts({
      provider,
      minutes: 20,
      date: wednesday,
      appointments,
      slotMinutes: 15,
      ...extra,
    });
  it("lists start times on the slot grid, skipping the break", () => {
    const list = starts();
    expect(list[0]).toBe("09:00");
    expect(list).not.toContain("12:00");
    expect(list).not.toContain("11:45"); // a 20-minute visit would run into lunch
    expect(list).toContain("11:30");
    expect(list).toContain("13:00");
    expect(list.at(-1)).toBe("16:30"); // 16:45 + 20 minutes would pass 17:00
    for (const time of list) expect((toMinutes(time) - 540) % 15).toBe(0);
  });
  it("removes the slots a booking holds but allows back-to-back visits", () => {
    const list = starts([item({ start: "10:00", end: "10:20" })]);
    expect(list).not.toContain("09:45");
    expect(list).not.toContain("10:00");
    expect(list).toContain("10:30");
    expect(list).toContain("09:30"); // ends exactly at 09:50, before 10:00
  });
  it("frees a slot held by a cancelled visit or by the visit being rescheduled", () => {
    expect(starts([item({ status: "cancelled" })])).toContain("10:00");
    expect(starts([item({ status: "no-show" })])).toContain("10:00");
    expect(starts([item({})], { ignoreId: "a1" })).toContain("10:00");
    expect(starts([item({})])).not.toContain("10:00");
  });
  it("only counts the same provider and the same day", () => {
    expect(starts([item({ providerId: "other" })])).toContain("10:00");
    expect(starts([item({ date: "2026-10-15" })])).toContain("10:00");
  });
  it("hides times that have already passed on the demo day", () => {
    const list = openStarts({
      provider,
      minutes: 20,
      date: "2026-10-13",
      appointments: [],
      slotMinutes: 15,
    });
    expect(list[0]).toBe("10:45");
    expect(
      openStarts({
        provider,
        minutes: 20,
        date: "2026-10-13",
        appointments: [],
        slotMinutes: 15,
        afterNow: false,
      })[0]
    ).toBe("09:00");
  });
  it("returns nothing on days off and when the visit cannot fit", () => {
    expect(starts([], { date: "2026-10-17" })).toEqual([]);
    expect(starts([], { date: "2026-10-21" })).toEqual([]);
    expect(starts([], { minutes: 600 })).toEqual([]);
  });
});

describe("conflicts and booking rules", () => {
  it("finds provider and patient conflicts, ignoring finished slots", () => {
    const base = candidate({ patientId: "pat2" });
    expect(findConflict([item({})], base)?.kind).toBe("provider");
    expect(findConflict([item({ providerId: "p2", patientId: "pat2" })], base)?.kind).toBe(
      "patient"
    );
    expect(findConflict([item({ status: "cancelled" })], base)).toBeNull();
    expect(findConflict([item({ id: "new" })], base)).toBeNull();
    expect(findConflict([item({ start: "10:20", end: "10:40" })], base)).toBeNull();
  });
  it("accepts a valid booking", () => {
    expect(bookingProblems(candidate(), context(), { checkPast: true })).toEqual([]);
  });
  it("explains every rule a booking breaks", () => {
    const ctx = context([item({})]);
    const problems = (over: Partial<Appointment>, options = {}) =>
      bookingProblems(candidate(over), ctx, options).join(" | ");
    expect(problems({})).toContain("already has a visit");
    expect(problems({ start: "08:00", end: "08:20" })).toContain("outside");
    expect(problems({ start: "12:15", end: "12:35" })).toContain("outside");
    expect(problems({ date: "2026-10-17" })).toContain("not working");
    expect(problems({ date: "2026-10-21" })).toContain("not working");
    expect(problems({ end: "10:30" })).toContain("takes 20 minutes");
    expect(problems({ start: "10:05", end: "10:25" })).toContain("15-minute slots");
    expect(problems({ providerId: "nobody" })).toContain("Choose a provider");
    expect(problems({ patientId: "ghost" })).toContain("Choose a patient");
    expect(problems({ visitTypeId: "mystery" })).toContain("Choose a visit type");
    expect(
      problems({ date: "2026-10-13", start: "09:00", end: "09:20" }, { checkPast: true })
    ).toContain("already passed");
  });
  it("only flags offered visit types", () => {
    const narrow = { ...context(), providers: [{ ...provider, visitTypeIds: ["long"] }] };
    expect(bookingProblems(candidate(), narrow).join()).toContain("does not offer");
  });
  it("lets cancelled visits skip slot rules", () => {
    expect(
      bookingProblems(candidate({ status: "cancelled", start: "03:00", end: "03:20" }), context())
    ).toEqual([]);
  });
});

describe("status workflow", () => {
  it("allows the front-desk path and rejects shortcuts", () => {
    expect(canTransition("scheduled", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "checked-in")).toBe(true);
    expect(canTransition("checked-in", "in-progress")).toBe(true);
    expect(canTransition("in-progress", "completed")).toBe(true);
    expect(canTransition("scheduled", "completed")).toBe(false);
    expect(canTransition("completed", "scheduled")).toBe(false);
    expect(canTransition("in-progress", "cancelled")).toBe(false);
    expect(allowedTransitions("completed")).toEqual([]);
  });
  it("lets cancelled and missed visits be reinstated, which needs a free slot", () => {
    expect(canTransition("cancelled", "scheduled")).toBe(true);
    expect(canTransition("no-show", "scheduled")).toBe(true);
    expect(needsSlot("cancelled", "scheduled")).toBe(true);
    expect(needsSlot("scheduled", "confirmed")).toBe(false);
    expect(holdsSlot("cancelled")).toBe(false);
    expect(holdsSlot("completed")).toBe(true);
  });
});

describe("availability across providers and days", () => {
  const other: Provider = {
    ...provider,
    id: "p2",
    name: "Dr. Second",
    hours: [null, day, day, day, day, day, null],
  };
  const ctx: ScheduleContext = { ...context(), providers: [provider, other] };
  it("lists slots day by day for one provider or for all that offer the visit", () => {
    const one = availability({
      visitType: visits[0]!,
      providerId: "p1",
      from: wednesday,
      days: 3,
      context: ctx,
    });
    expect(one).toHaveLength(3);
    expect(one[0]!.slots.every((slot) => slot.providerId === "p1")).toBe(true);
    const all = availability({
      visitType: visits[0]!,
      providerId: "",
      from: wednesday,
      days: 1,
      context: ctx,
    });
    expect(new Set(all[0]!.slots.map((slot) => slot.providerId))).toEqual(new Set(["p1", "p2"]));
  });
  it("shows a weekend as empty and finds the next open slot", () => {
    const days = availability({
      visitType: visits[0]!,
      providerId: "p1",
      from: "2026-10-17",
      days: 2,
      context: ctx,
    });
    expect(days.every((entry) => entry.slots.length === 0)).toBe(true);
    const next = firstAvailable({
      visitType: visits[0]!,
      providerId: "p1",
      from: "2026-10-17",
      days: 5,
      context: ctx,
    });
    expect(next).toMatchObject({ date: "2026-10-19", start: "09:00" });
  });
  it("returns null when nothing is free in the window", () => {
    expect(
      firstAvailable({
        visitType: visits[0]!,
        providerId: "p1",
        from: "2026-10-17",
        days: 2,
        context: ctx,
      })
    ).toBeNull();
  });
  it("measures how full a schedule is", () => {
    expect(utilization(provider, [], wednesday, 1)).toBe(0);
    // 8 hours open minus a 1 hour break = 420 minutes.
    expect(
      utilization(provider, [item({ start: "09:00", end: "10:00" })], wednesday, 1)
    ).toBeCloseTo(60 / 420);
    expect(utilization(provider, [], "2026-10-17", 1)).toBe(0);
  });
});

describe("waitlist matching", () => {
  const entry = (over: Partial<WaitlistEntry>): WaitlistEntry => ({
    id: "w",
    patientId: "x",
    visitTypeId: "short",
    providerId: "",
    urgency: "routine",
    earliest: "",
    notes: "",
    createdAt: "2026-10-01T10:00:00",
    ...over,
  });
  it("matches by visit type, provider and earliest date, most urgent first", () => {
    const freed = { providerId: "p1", visitTypeId: "short", date: wednesday, patientId: "gone" };
    const list = [
      entry({ id: "routine-old", createdAt: "2026-09-01T10:00:00" }),
      entry({ id: "urgent", urgency: "urgent", createdAt: "2026-10-05T10:00:00" }),
      entry({ id: "other-type", visitTypeId: "long" }),
      entry({ id: "other-provider", providerId: "p2" }),
      entry({ id: "too-early", earliest: "2026-10-20" }),
      entry({ id: "same-patient", patientId: "gone" }),
      entry({ id: "soon", urgency: "soon", providerId: "p1" }),
    ];
    expect(matchingWaitlist(list, freed).map((match) => match.id)).toEqual([
      "urgent",
      "soon",
      "routine-old",
    ]);
  });
});

describe("references, formatting and patient helpers", () => {
  it("derives a stable booking reference", () => {
    expect(referenceFor("appointment-1")).toMatch(/^MND-[A-Z2-9]{4}$/);
    expect(referenceFor("appointment-1")).toBe(referenceFor("appointment-1"));
    expect(referenceFor("appointment-1")).not.toBe(referenceFor("appointment-2"));
  });
  it("formats clinic-local dates and times", () => {
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("17:45")).toBe("5:45 PM");
    expect(formatTime("17:45", "24h")).toBe("17:45");
    expect(formatRange("09:00", "09:20")).toBe("9:00 AM – 9:20 AM");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(90)).toBe("1 h 30 min");
    expect(formatDate("2026-10-13", "dayMonth")).toBe("Tue, Oct 13");
    expect(formatDate("2026-10-13", "day")).toBe("Tue 13");
  });
  it("searches every word across a patient's details", () => {
    const patient = (over: Partial<Patient>): Patient => ({
      id: "1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "(415) 555-0101",
      birthday: "1990-05-20",
      insurance: "Northwind Health",
      preferredProviderId: "",
      tags: ["Chronic care"],
      notes: "",
      createdAt: "2026-01-01T00:00:00",
      ...over,
    });
    const list = [
      patient({}),
      patient({ id: "2", firstName: "Grace", lastName: "Hopper", tags: [] }),
    ];
    expect(searchPatients(list, "ada love")).toHaveLength(1);
    expect(searchPatients(list, "4155550101")).toHaveLength(2);
    expect(searchPatients(list, "chronic northwind")).toHaveLength(1);
    expect(searchPatients(list, "")).toHaveLength(2);
    expect(initialsOf("Dr. Amara Okafor")).toBe("AO");
    expect(hueFor("Ada")).toBe(hueFor("Ada"));
    expect(ageOn("1990-05-20", "2026-10-13")).toBe(36);
    expect(ageOn("", "2026-10-13")).toBeNull();
  });
});

describe("CSV export", () => {
  it("neutralises formula cells and quotes awkward ones", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1 555")).toBe("'+1 555");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell(42)).toBe("42");
  });
  it("exports appointments and patients with a header row", () => {
    const patient: Patient = {
      id: "pat1",
      firstName: "=Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "(415) 555-0101",
      birthday: "",
      insurance: "",
      preferredProviderId: "p1",
      tags: ["a", "b"],
      notes: "",
      createdAt: "2026-01-01T00:00:00",
    };
    const appointment = {
      ...candidate({ id: "a" }),
      reference: "MND-AAAA",
      reason: "Check, up",
      notes: "",
      source: "staff",
      createdAt: "",
      updatedAt: "",
    } as Appointment;
    const csv = appointmentsCsv([appointment], {
      patients: [{ ...patient, id: "pat2" }],
      providers: [provider],
      visitTypes: [
        {
          id: "short",
          name: "Short",
          description: "",
          minutes: 20,
          price: 1,
          color: "sky",
          online: true,
        },
      ],
    });
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toContain("Reference");
    expect(lines[1]).toContain("MND-AAAA");
    expect(lines[1]).toContain("'=Ada Lovelace");
    expect(lines[1]).toContain('"Check, up"');
    expect(patientsCsv([patient], [provider]).split("\r\n")[1]).toContain("Dr. Test");
  });
});
