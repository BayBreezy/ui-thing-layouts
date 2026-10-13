import { array, boolean, number, object, string } from "yup";

import { isValidDate, isValidTime } from "./schedule";
import {
  appointmentSources,
  appointmentStatuses,
  bulkActions,
  deletableKinds,
  reminderLeads,
  slotIntervals,
  urgencies,
  visitColors,
} from "./types";

const text = (label: string, max = 200) => string().trim().required().max(max).label(label);
const optionalText = (label: string, max = 200) => string().trim().defined().max(max).label(label);
const id = () => text("ID", 100);
const timestamp = () =>
  string()
    .required()
    .test("timestamp", "Invalid timestamp", (value) => Number.isFinite(Date.parse(value)));
const calendarDate = (label = "Date") =>
  string()
    .required(`Choose a ${label.toLowerCase()}`)
    .label(label)
    .test("date", "Use a valid date", (value) => isValidDate(value));
const optionalDate = (label = "Date") =>
  string()
    .defined()
    .label(label)
    .test("date", "Use a valid date", (value) => value === "" || isValidDate(value));
const clockTime = (label = "Time") =>
  string()
    .required(`Choose a ${label.toLowerCase()}`)
    .label(label)
    .test("time", "Use a valid time", (value) => isValidTime(value));
const optionalTime = (label = "Time") =>
  string()
    .defined()
    .label(label)
    .test("time", "Use a valid time", (value) => value === "" || isValidTime(value));
const phone = () =>
  string()
    .trim()
    .required("Enter a phone number")
    .max(30)
    .matches(/^[+()\d\s.\-x]{7,30}$/, "Enter a valid phone number")
    .label("Phone");
const email = () =>
  string()
    .trim()
    .email("Enter a valid email address")
    .required("Enter an email address")
    .max(200)
    .label("Email");

export const workingDaySchema = object({
  start: clockTime("Start"),
  end: clockTime("End"),
  breakStart: optionalTime("Break start"),
  breakEnd: optionalTime("Break end"),
}).test(
  "order",
  "A working day must end after it starts",
  // A day off is stored as null; only real working days have hours to compare.
  (value) => value == null || value.start < value.end
);
export const providerSchema = object({
  id: id(),
  name: text("Name", 80),
  title: optionalText("Title", 40),
  specialty: text("Specialty", 80),
  room: optionalText("Room", 40),
  hue: number().integer().min(0).max(360).required(),
  hours: array()
    .of(workingDaySchema.nullable().defined())
    .length(7, "Provide hours for each day of the week")
    .required(),
  daysOff: array().of(calendarDate("Day off")).required().max(60),
  visitTypeIds: array().of(id()).required().min(1, "Choose at least one visit type").max(20),
  acceptingNew: boolean().required(),
  active: boolean().required(),
  bio: optionalText("Bio", 500),
});
export const visitTypeSchema = object({
  id: id(),
  name: text("Name", 60),
  description: optionalText("Description", 300),
  minutes: number().integer().min(5).max(240).required(),
  price: number().min(0).max(5000).required(),
  color: string().oneOf(visitColors).required(),
  online: boolean().required(),
});
export const patientSchema = object({
  id: id(),
  firstName: text("First name", 80),
  lastName: text("Last name", 80),
  email: email(),
  phone: phone(),
  birthday: optionalDate("Birthday"),
  insurance: optionalText("Insurance", 120),
  preferredProviderId: string().defined(),
  tags: array().of(text("Tag", 30)).required().max(12),
  notes: string().defined().max(5000),
  createdAt: timestamp(),
});
export const appointmentSchema = object({
  id: id(),
  reference: text("Reference", 20),
  patientId: text("Patient", 100),
  providerId: text("Provider", 100),
  visitTypeId: text("Visit type", 100),
  date: calendarDate("Date"),
  start: clockTime("Start time"),
  end: clockTime("End time"),
  status: string().oneOf(appointmentStatuses).required(),
  reason: optionalText("Reason", 300),
  notes: string().defined().max(5000),
  source: string().oneOf(appointmentSources).required(),
  createdAt: timestamp(),
  updatedAt: timestamp(),
}).test("order", "A visit must end after it starts", (value) =>
  Boolean(value && value.start < value.end)
);
export const waitlistSchema = object({
  id: id(),
  patientId: text("Patient", 100),
  visitTypeId: text("Visit type", 100),
  providerId: string().defined(),
  urgency: string().oneOf(urgencies).required(),
  earliest: optionalDate("Earliest date"),
  notes: string().defined().max(1000),
  createdAt: timestamp(),
});
export const clinicSchema = object({
  name: text("Clinic name", 100),
  phone: phone(),
  email: email(),
  address: optionalText("Address", 200),
  slotMinutes: number()
    .oneOf([...slotIntervals])
    .required(),
  bookingWindowDays: number().integer().min(7).max(90).required(),
  onlineBooking: boolean().required(),
  reminderHours: number()
    .oneOf([...reminderLeads])
    .required(),
  emailReminders: boolean().required(),
  smsReminders: boolean().required(),
});
export const profileSchema = object({
  id: id(),
  name: text("Name", 100),
  email: email(),
  role: text("Role", 100),
});
export const preferencesSchema = object({
  appearance: string().oneOf(["system", "light", "dark"]).required(),
  notify: boolean().required(),
  pageSize: number().oneOf([10, 20, 50]).required(),
  timeFormat: string().oneOf(["12h", "24h"]).required(),
});
export const settingsSchema = object({
  profile: profileSchema.required(),
  clinic: clinicSchema.required(),
  preferences: preferencesSchema.required(),
});

const slimAppointmentSchema = object({
  id: id(),
  patientId: id(),
  providerId: id(),
  date: calendarDate(),
  start: clockTime(),
  end: clockTime(),
  status: string().oneOf(appointmentStatuses).required(),
});
/** The scheduling context a stateless endpoint receives. The client sends what it knows. */
export const scheduleContextSchema = object({
  providers: array().of(providerSchema).required().max(50),
  visitTypes: array()
    .of(object({ id: id(), minutes: number().integer().min(5).max(240).required() }))
    .required()
    .max(50),
  patientIds: array().of(id()).required().max(5000),
  slotMinutes: number()
    .oneOf([...slotIntervals])
    .required(),
  appointments: array().of(slimAppointmentSchema).required().max(5000),
});
export const previousPlacementSchema = object({
  providerId: id(),
  date: calendarDate(),
  start: clockTime(),
});

export const bookingSchema = object({
  visitTypeId: id(),
  providerId: string().defined(),
  date: calendarDate(),
  start: clockTime("Start time"),
  reason: optionalText("Reason", 300),
  patient: object({
    firstName: text("First name", 80),
    lastName: text("Last name", 80),
    email: email(),
    phone: phone(),
    birthday: optionalDate("Date of birth"),
  }).required(),
});

export const authSchemas = {
  login: object({
    email: email(),
    password: string().required("Enter your password").min(8).max(200),
  }),
  signup: object({
    name: text("Name", 100),
    email: email(),
    password: string().required("Choose a password").min(8, "Use at least 8 characters").max(200),
  }),
  "forgot-password": object({ email: email() }),
  "reset-password": object({
    password: string().required("Choose a password").min(8, "Use at least 8 characters").max(200),
  }),
} as const;

export { bulkActions, deletableKinds };

export const demoStateSchema = object({
  providers: array().of(providerSchema).required(),
  visitTypes: array().of(visitTypeSchema).required(),
  patients: array().of(patientSchema).required(),
  appointments: array().of(appointmentSchema).required(),
  waitlist: array().of(waitlistSchema).required(),
  activity: array()
    .of(
      object({
        id: id(),
        title: text("Title", 300),
        href: string().defined(),
        createdAt: timestamp(),
      })
    )
    .required(),
  notifications: array()
    .of(
      object({
        id: id(),
        title: text("Title", 300),
        href: string().defined(),
        read: boolean().required(),
      })
    )
    .required(),
  profile: profileSchema.required(),
  clinic: clinicSchema.required(),
  preferences: preferencesSchema.required(),
  signedIn: boolean().required(),
});
