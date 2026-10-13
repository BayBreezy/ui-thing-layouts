import { Faker, en } from "@faker-js/faker";

import { fullName } from "../../shared/patients";
import {
  addDays,
  fromMinutes,
  findConflict,
  holdsSlot,
  referenceFor,
  slim,
  toMinutes,
  workingDay,
} from "../../shared/schedule";
import type {
  Activity,
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  Clinic,
  DemoState,
  Notification,
  Patient,
  Provider,
  Urgency,
  VisitType,
  WaitlistEntry,
  WeekHours,
  WorkingDay,
} from "../../shared/types";
import { referenceDate, referenceTime } from "../../shared/types";

/* The only file that imports Faker. It runs on the server, so Faker never reaches the browser.
 * Seed 42 and a fixed demo day make the data identical on every request. */

const day = (start: string, end: string, breakStart = "", breakEnd = ""): WorkingDay => ({
  start,
  end,
  breakStart,
  breakEnd,
});
const weekdays = (value: WorkingDay): WeekHours => [null, value, value, value, value, value, null];

const visitTypes: VisitType[] = [
  {
    id: "visit-new",
    name: "New patient visit",
    description: "A first appointment with a full history and care plan.",
    minutes: 45,
    price: 180,
    color: "rose",
    online: true,
  },
  {
    id: "visit-follow-up",
    name: "Follow-up visit",
    description: "Check progress, review results or adjust treatment.",
    minutes: 20,
    price: 90,
    color: "sky",
    online: true,
  },
  {
    id: "visit-physical",
    name: "Annual physical",
    description: "A yearly wellness exam with screenings and prevention planning.",
    minutes: 40,
    price: 150,
    color: "teal",
    online: true,
  },
  {
    id: "visit-sick",
    name: "Same-day sick visit",
    description: "Colds, infections, minor injuries and anything that can't wait.",
    minutes: 20,
    price: 85,
    color: "amber",
    online: true,
  },
  {
    id: "visit-tele",
    name: "Telehealth check-in",
    description: "A short video visit from home.",
    minutes: 15,
    price: 60,
    color: "slate",
    online: true,
  },
  {
    id: "visit-vaccine",
    name: "Vaccination",
    description: "Flu shots and routine immunizations.",
    minutes: 15,
    price: 40,
    color: "orange",
    online: true,
  },
  {
    id: "visit-skin",
    name: "Skin check",
    description: "A full skin exam with a dermatology specialist.",
    minutes: 30,
    price: 120,
    color: "teal",
    online: true,
  },
];

const providers: Provider[] = [
  {
    id: "provider-1",
    name: "Dr. Amara Okafor",
    title: "MD",
    specialty: "Family medicine",
    room: "Room 1",
    hue: 14,
    hours: weekdays(day("08:00", "17:00", "12:00", "13:00")),
    daysOff: [],
    visitTypeIds: [
      "visit-new",
      "visit-follow-up",
      "visit-physical",
      "visit-sick",
      "visit-tele",
      "visit-vaccine",
    ],
    acceptingNew: true,
    active: true,
    bio: "Whole-family care with a focus on prevention and long-term relationships.",
  },
  {
    id: "provider-2",
    name: "Dr. Daniel Whitfield",
    title: "MD",
    specialty: "Internal medicine",
    room: "Room 2",
    hue: 220,
    hours: weekdays(day("09:00", "17:30", "12:30", "13:30")),
    daysOff: ["2026-10-16"],
    visitTypeIds: ["visit-new", "visit-follow-up", "visit-physical", "visit-tele"],
    acceptingNew: true,
    active: true,
    bio: "Adult internal medicine, chronic conditions and complex care coordination.",
  },
  {
    id: "provider-3",
    name: "Dr. Priya Nair",
    title: "MD",
    specialty: "Pediatrics",
    room: "Room 3",
    hue: 40,
    hours: weekdays(day("08:30", "16:30", "12:00", "13:00")),
    daysOff: [],
    visitTypeIds: [
      "visit-follow-up",
      "visit-physical",
      "visit-sick",
      "visit-tele",
      "visit-vaccine",
    ],
    acceptingNew: true,
    active: true,
    bio: "Newborns through teens: well-child visits, vaccines and everyday illness.",
  },
  {
    id: "provider-4",
    name: "Dr. Mateo Alvarez",
    title: "MD",
    specialty: "Dermatology",
    room: "Room 4",
    hue: 190,
    hours: [
      null,
      day("09:00", "16:00", "12:00", "12:30"),
      null,
      day("09:00", "16:00", "12:00", "12:30"),
      null,
      day("09:00", "16:00", "12:00", "12:30"),
      null,
    ],
    daysOff: ["2026-10-14"],
    visitTypeIds: ["visit-new", "visit-follow-up", "visit-skin", "visit-tele"],
    acceptingNew: true,
    active: true,
    bio: "Medical and cosmetic dermatology, skin cancer screening and acne care.",
  },
  {
    id: "provider-5",
    name: "Sarah Lindgren",
    title: "NP",
    specialty: "Urgent care",
    room: "Room 5",
    hue: 330,
    hours: weekdays(day("08:00", "18:00", "13:00", "13:30")),
    daysOff: [],
    visitTypeIds: ["visit-follow-up", "visit-sick", "visit-vaccine", "visit-tele"],
    acceptingNew: true,
    active: true,
    bio: "Same-day care for minor illness and injury, plus walk-in vaccinations.",
  },
  {
    id: "provider-6",
    name: "Dr. Hana Kobayashi",
    title: "MD",
    specialty: "Women's health",
    room: "Room 6",
    hue: 110,
    hours: [
      null,
      null,
      day("09:00", "17:30", "12:30", "13:30"),
      null,
      day("09:00", "17:30", "12:30", "13:30"),
      null,
      day("09:00", "13:00"),
    ],
    daysOff: ["2026-10-20", "2026-10-22"],
    visitTypeIds: ["visit-follow-up", "visit-physical", "visit-vaccine", "visit-tele"],
    acceptingNew: false,
    active: true,
    bio: "Preventive and reproductive health care. Not accepting new patients right now.",
  },
];

const clinic: Clinic = {
  name: "Harbor Light Family Clinic",
  phone: "(415) 555-0142",
  email: "hello@harborlight.example",
  address: "214 Marina Way, Suite 3, Harbor City",
  slotMinutes: 15,
  bookingWindowDays: 28,
  onlineBooking: true,
  reminderHours: 24,
  emailReminders: true,
  smsReminders: true,
};

const reasons: Record<string, string[]> = {
  "visit-new": ["Establishing care", "Transferring from another clinic", "Wants a full check-up"],
  "visit-follow-up": [
    "Blood pressure review",
    "Reviewing lab results",
    "Medication adjustment",
    "Post-visit check",
    "Managing a chronic condition",
  ],
  "visit-physical": [
    "Yearly exam",
    "Sports physical",
    "Work-required physical",
    "Well-child visit",
  ],
  "visit-sick": ["Sore throat and fever", "Persistent cough", "Ear pain", "Sprained ankle", "Rash"],
  "visit-tele": ["Prescription refill", "Reviewing symptoms", "Quick question about results"],
  "visit-vaccine": ["Seasonal flu shot", "Tetanus booster", "Routine immunization"],
  "visit-skin": ["Annual skin check", "Mole to be looked at", "Acne follow-up"],
};
const insurers = [
  "Blue Harbor PPO",
  "Northwind Health",
  "Summit Care HMO",
  "Evergreen Health Plan",
  "Medicare",
  "Self-pay",
];
const tagPool = [
  "Chronic care",
  "Prefers mornings",
  "Needs interpreter",
  "Wheelchair access",
  "Text reminders",
];

export function createDemoState(): DemoState {
  const faker = new Faker({ locale: [en] });
  faker.seed(42);
  const ascii = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();

  // Patients -------------------------------------------------------------------------------
  const patients: Patient[] = [];
  const emails = new Set<string>();
  const childCount = 14;
  const total = 66;
  for (let index = 0; index < total; index++) {
    const child = index < childCount;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    let email = `${ascii(firstName)}.${ascii(lastName)}@example.com`;
    for (let n = 2; emails.has(email); n++)
      email = `${ascii(firstName)}.${ascii(lastName)}${n}@example.com`;
    emails.add(email);
    const year = child
      ? faker.number.int({ min: 2011, max: 2025 })
      : faker.number.int({ min: 1942, max: 2004 });
    const month = faker.number.int({ min: 1, max: 12 });
    const dayOfMonth = faker.number.int({ min: 1, max: 28 });
    const preferred = child
      ? "provider-3"
      : (faker.helpers.maybe(
          () => faker.helpers.arrayElement(["provider-1", "provider-2", "provider-5"]),
          {
            probability: 0.5,
          }
        ) ?? "");
    patients.push({
      id: `patient-${index + 1}`,
      firstName,
      lastName,
      email,
      phone: `(415) 555-01${String(index + 10).padStart(2, "0")}`,
      birthday: `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`,
      insurance: faker.helpers.arrayElement(insurers),
      preferredProviderId: preferred,
      tags: faker.helpers.arrayElements(tagPool, { min: 0, max: index % 3 === 0 ? 2 : 1 }),
      notes: "",
      createdAt: addDays(referenceDate, -faker.number.int({ min: 30, max: 700 })) + "T09:00:00",
    });
  }
  const children = patients.slice(0, childCount);
  const adults = patients.slice(childCount);

  // Appointments ---------------------------------------------------------------------------
  const appointments: Appointment[] = [];
  const nowMinutes = toMinutes(referenceTime);
  const visitById = new Map(visitTypes.map((item) => [item.id, item]));
  const alignUp = (value: number, origin: number, grid: number) =>
    origin + Math.ceil((value - origin) / grid) * grid;
  let counter = 0;

  for (let offset = -14; offset <= 21; offset++) {
    const date = addDays(referenceDate, offset);
    for (const provider of providers) {
      const hours = workingDay(provider, date);
      if (!hours) continue;
      const open = toMinutes(hours.start);
      const close = toMinutes(hours.end);
      const breakStart = hours.breakStart ? toMinutes(hours.breakStart) : -1;
      const breakEnd = hours.breakEnd ? toMinutes(hours.breakEnd) : -1;
      const density =
        offset < 0 ? 0.36 : offset === 0 ? 0.42 : offset <= 7 ? 0.38 : offset <= 14 ? 0.26 : 0.16;
      let cursor = open;
      let inProgressUsed = false;
      let checkedInUsed = false;
      while (cursor + 15 <= close) {
        if (breakStart >= 0 && cursor >= breakStart && cursor < breakEnd) {
          cursor = alignUp(breakEnd, open, clinic.slotMinutes);
          continue;
        }
        if (faker.number.float() > density) {
          cursor += clinic.slotMinutes * faker.number.int({ min: 1, max: 2 });
          continue;
        }
        const options = provider.visitTypeIds.filter(
          (id) => id !== "visit-new" || faker.number.float() < 0.25
        );
        const visit = visitById.get(faker.helpers.arrayElement(options))!;
        const end = cursor + visit.minutes;
        const crossesBreak = breakStart >= 0 && cursor < breakEnd && end > breakStart;
        if (end > close || crossesBreak) {
          cursor += clinic.slotMinutes;
          continue;
        }
        const pool = provider.id === "provider-3" ? children : adults;
        const start = fromMinutes(cursor);
        const finish = fromMinutes(end);
        let patient = faker.helpers.arrayElement(pool);
        for (let tries = 0; tries < 8; tries++) {
          const clash = findConflict(appointments.filter((item) => item.date === date).map(slim), {
            id: "",
            patientId: patient.id,
            providerId: provider.id,
            date,
            start,
            end: finish,
          });
          if (!clash) break;
          patient = faker.helpers.arrayElement(pool);
        }
        counter++;
        let status: AppointmentStatus;
        if (offset < 0) {
          status = faker.helpers.weightedArrayElement<AppointmentStatus>([
            { weight: 86, value: "completed" },
            { weight: 6, value: "no-show" },
            { weight: 8, value: "cancelled" },
          ]);
        } else if (offset === 0) {
          if (end <= nowMinutes)
            status = faker.helpers.weightedArrayElement<AppointmentStatus>([
              { weight: 92, value: "completed" },
              { weight: 8, value: "no-show" },
            ]);
          else if (cursor <= nowMinutes) {
            status = inProgressUsed ? "checked-in" : "in-progress";
            inProgressUsed = true;
          } else if (!checkedInUsed && cursor - nowMinutes <= 45) {
            status = "checked-in";
            checkedInUsed = true;
          } else
            status = faker.helpers.weightedArrayElement<AppointmentStatus>([
              { weight: 62, value: "confirmed" },
              { weight: 33, value: "scheduled" },
              { weight: 5, value: "cancelled" },
            ]);
        } else {
          status = faker.helpers.weightedArrayElement<AppointmentStatus>([
            { weight: offset <= 7 ? 62 : 35, value: "confirmed" },
            { weight: offset <= 7 ? 33 : 60, value: "scheduled" },
            { weight: 5, value: "cancelled" },
          ]);
        }
        const source = faker.helpers.weightedArrayElement<AppointmentSource>([
          { weight: 55, value: "staff" },
          { weight: 25, value: "online" },
          { weight: 18, value: "phone" },
          { weight: 2, value: "waitlist" },
        ]);
        const id = `appointment-${counter}`;
        const createdAt = addDays(date, -faker.number.int({ min: 2, max: 21 })) + "T09:00:00";
        appointments.push({
          id,
          reference: referenceFor(id),
          patientId: patient.id,
          providerId: provider.id,
          visitTypeId: visit.id,
          date,
          start,
          end: finish,
          status,
          reason: faker.helpers.arrayElement(reasons[visit.id] ?? ["Visit"]),
          notes: "",
          source,
          createdAt,
          updatedAt: createdAt,
        });
        cursor = alignUp(
          end + (faker.number.float() < 0.25 ? clinic.slotMinutes : 0),
          open,
          clinic.slotMinutes
        );
      }
    }
  }
  appointments.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));

  // Waitlist -------------------------------------------------------------------------------
  const waitlist: WaitlistEntry[] = [];
  const urgencyPlan: Urgency[] = [
    "urgent",
    "soon",
    "soon",
    "routine",
    "routine",
    "routine",
    "soon",
    "routine",
  ];
  const waitlistVisits = [
    "visit-sick",
    "visit-follow-up",
    "visit-physical",
    "visit-follow-up",
    "visit-skin",
    "visit-new",
    "visit-follow-up",
    "visit-physical",
  ];
  const waitlistNotes = [
    "Worsening symptoms, wants the earliest slot.",
    "Can come any weekday morning.",
    "Needs a visit before travel.",
    "Prefers Dr. Okafor if possible.",
    "Referred by primary care.",
    "Flexible with times.",
    "Reviewing new medication.",
    "Bring school forms.",
  ];
  for (let index = 0; index < urgencyPlan.length; index++) {
    const visitTypeId = waitlistVisits[index]!;
    const capable = providers.filter((item) => item.visitTypeIds.includes(visitTypeId));
    const pool = visitTypeId === "visit-physical" && index === 7 ? children : adults;
    waitlist.push({
      id: `waitlist-${index + 1}`,
      patientId: pool[(index * 5 + 3) % pool.length]!.id,
      visitTypeId,
      providerId: index % 3 === 0 ? "" : capable[index % capable.length]!.id,
      urgency: urgencyPlan[index]!,
      earliest: index % 2 === 0 ? "" : addDays(referenceDate, 1 + (index % 4)),
      notes: waitlistNotes[index]!,
      createdAt: addDays(referenceDate, -(index + 1)) + "T14:00:00",
    });
  }

  // Activity ---------------------------------------------------------------------------------
  const upcoming = appointments.filter(
    (item) => item.date > referenceDate && holdsSlot(item.status)
  );
  const patientName = new Map(patients.map((item) => [item.id, fullName(item)]));
  const activity: Activity[] = [];
  const notifications: Notification[] = [];
  const recent = upcoming.filter((item) => item.source === "online").slice(0, 4);
  recent.forEach((item, index) => {
    const entry = {
      id: `activity-online-${index + 1}`,
      title: `${patientName.get(item.patientId)} booked online for ${item.date}`,
      href: "/appointments/" + item.id,
    };
    activity.push({
      ...entry,
      createdAt: `${referenceDate}T${String(7 + index).padStart(2, "0")}:${String(index * 10 + 10).padStart(2, "0")}:00`,
    });
    notifications.push({ ...entry, read: index > 1 });
  });
  const cancelled = appointments.find(
    (item) => item.status === "cancelled" && item.date > referenceDate
  );
  if (cancelled) {
    const entry = {
      id: "activity-cancelled",
      title: `${patientName.get(cancelled.patientId)} cancelled their ${cancelled.date} visit`,
      href: "/appointments/" + cancelled.id,
    };
    activity.push({ ...entry, createdAt: addDays(referenceDate, -1) + "T16:20:00" });
    notifications.push({ ...entry, read: false });
  }
  activity.push({
    id: "activity-waitlist",
    title: `${patientName.get(waitlist[0]!.patientId)} joined the waitlist`,
    href: "/waitlist",
    createdAt: addDays(referenceDate, -1) + "T11:05:00",
  });
  activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    providers: structuredClone(providers),
    visitTypes: structuredClone(visitTypes),
    patients,
    appointments,
    waitlist,
    activity,
    notifications,
    profile: {
      id: "profile-1",
      name: "Jordan Ellis",
      email: "jordan.ellis@example.com",
      role: "Front desk lead",
    },
    clinic: { ...clinic },
    preferences: { appearance: "system", notify: true, pageSize: 20, timeFormat: "12h" },
    signedIn: false,
  };
}
