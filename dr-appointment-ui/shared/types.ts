/**
 * The fixed "today" of the demo. Seed data is generated relative to this day and time, so the
 * schedule always looks current and tests are deterministic. It is a Tuesday.
 */
export const referenceDate = "2026-10-13";
/** The demo clock: appointments before this time have happened, later ones are still ahead. */
export const referenceTime = "10:40";

export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "checked-in",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
] as const;
export const appointmentSources = ["staff", "online", "phone", "waitlist"] as const;
export const urgencies = ["routine", "soon", "urgent"] as const;
export const visitColors = ["rose", "sky", "amber", "teal", "slate", "orange"] as const;
export const slotIntervals = [10, 15, 20, 30] as const;
export const bulkActions = ["confirm", "cancel"] as const;
export const deletableKinds = ["appointment", "waitlist", "patient"] as const;
export const reminderLeads = [2, 24, 48] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];
export type AppointmentSource = (typeof appointmentSources)[number];
export type Urgency = (typeof urgencies)[number];
export type VisitColor = (typeof visitColors)[number];
export type BulkAction = (typeof bulkActions)[number];
export type DeletableKind = (typeof deletableKinds)[number];

/** One weekday of a provider's schedule. `null` means the provider does not work that day. */
export interface WorkingDay {
  start: string;
  end: string;
  /** Optional unbooked break, both set or both empty. */
  breakStart: string;
  breakEnd: string;
}
/** Index 0 is Sunday, matching `Date#getUTCDay()`. */
export type WeekHours = (WorkingDay | null)[];

export interface Provider {
  id: string;
  name: string;
  title: string;
  specialty: string;
  room: string;
  hue: number;
  hours: WeekHours;
  daysOff: string[];
  visitTypeIds: string[];
  acceptingNew: boolean;
  active: boolean;
  bio: string;
}
export interface VisitType {
  id: string;
  name: string;
  description: string;
  minutes: number;
  price: number;
  color: VisitColor;
  online: boolean;
}
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  insurance: string;
  preferredProviderId: string;
  tags: string[];
  notes: string;
  createdAt: string;
}
export interface Appointment {
  id: string;
  /** Short, human-friendly code shown to patients, such as MND-4F7K. */
  reference: string;
  patientId: string;
  providerId: string;
  visitTypeId: string;
  /** Clinic-local calendar date, `YYYY-MM-DD`. Never a UTC timestamp. */
  date: string;
  /** Clinic-local `HH:mm`. */
  start: string;
  end: string;
  status: AppointmentStatus;
  reason: string;
  notes: string;
  source: AppointmentSource;
  createdAt: string;
  updatedAt: string;
}
export interface WaitlistEntry {
  id: string;
  patientId: string;
  visitTypeId: string;
  /** Empty means "any provider". */
  providerId: string;
  urgency: Urgency;
  /** Earliest date the patient can come, or empty. */
  earliest: string;
  notes: string;
  createdAt: string;
}
export interface Clinic {
  name: string;
  phone: string;
  email: string;
  address: string;
  slotMinutes: (typeof slotIntervals)[number];
  bookingWindowDays: number;
  onlineBooking: boolean;
  reminderHours: (typeof reminderLeads)[number];
  emailReminders: boolean;
  smsReminders: boolean;
}
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}
export interface Preferences {
  appearance: "system" | "light" | "dark";
  notify: boolean;
  pageSize: 10 | 20 | 50;
  timeFormat: "12h" | "24h";
}
export interface Activity {
  id: string;
  title: string;
  href: string;
  createdAt: string;
}
export interface Notification {
  id: string;
  title: string;
  href: string;
  read: boolean;
}
export interface SettingsRecord {
  profile: Profile;
  clinic: Clinic;
  preferences: Preferences;
}
export interface DemoState extends SettingsRecord {
  providers: Provider[];
  visitTypes: VisitType[];
  patients: Patient[];
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
  activity: Activity[];
  notifications: Notification[];
  signedIn: boolean;
}

/** The slim shape of a booking that APIs receive to check conflicts without server state. */
export interface SlimAppointment {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  start: string;
  end: string;
  status: AppointmentStatus;
}
/** Everything a stateless endpoint needs to validate scheduling rules. */
export interface ScheduleContext {
  providers: Provider[];
  visitTypes: Pick<VisitType, "id" | "minutes">[];
  patientIds: string[];
  slotMinutes: number;
  appointments: SlimAppointment[];
}
export interface Slot {
  providerId: string;
  start: string;
}
export interface DayAvailability {
  date: string;
  slots: Slot[];
}
export interface BookingRequest {
  visitTypeId: string;
  providerId: string;
  date: string;
  start: string;
  reason: string;
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthday: string;
  };
}
export interface BookingResult {
  appointment: Appointment;
  patient: Patient;
  isNewPatient: boolean;
}
