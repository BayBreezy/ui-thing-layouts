import type { NuxtApp } from "#app";
import { fullName } from "#shared/patients";
import { addDays, holdsSlot, matchingWaitlist, referenceFor, slim } from "#shared/schedule";
import type {
  Appointment,
  AppointmentStatus,
  BookingRequest,
  BulkAction,
  DayAvailability,
  DemoState,
  Patient,
  Provider,
  ScheduleContext,
  SettingsRecord,
  WaitlistEntry,
} from "#shared/types";
import { newId, now } from "~/utils/demo";
import { storageKey } from "~/utils/persistence";
const controllers = new WeakMap<NuxtApp, Set<AbortController>>();

export function useDemo() {
  const app = useNuxtApp();
  const state = useState<DemoState | null>("mendly-demo", () => null);
  const ready = useState("mendly-ready", () => false);
  const revision = useState("mendly-revision", () => 0);
  const storageWarning = useState("mendly-storage-warning", () => "");

  async function request<T>(
    path: string,
    body?: unknown,
    method: "GET" | "POST" = "POST"
  ): Promise<T> {
    const epoch = revision.value;
    const controller = new AbortController();
    if (!controllers.has(app)) controllers.set(app, new Set());
    controllers.get(app)!.add(controller);
    try {
      const result = await $fetch<T>(path, {
        method,
        body: body as Record<string, unknown> | undefined,
        signal: controller.signal,
      });
      if (epoch !== revision.value) throw new Error("The demo was reset. Try your action again.");
      return result as T;
    } finally {
      controllers.get(app)!.delete(controller);
    }
  }
  function current() {
    if (!state.value) throw new Error("Workspace is unavailable");
    return state.value;
  }

  /**
   * What a stateless endpoint needs to check scheduling rules. Only visits in the date window are
   * sent, which keeps requests small however long the schedule grows.
   */
  function scheduleContext(from: string, days = 1): ScheduleContext {
    const draft = current();
    const last = addDays(from, days - 1);
    return {
      providers: draft.providers,
      visitTypes: draft.visitTypes.map((item) => ({ id: item.id, minutes: item.minutes })),
      patientIds: draft.patients.map((item) => item.id),
      slotMinutes: draft.clinic.slotMinutes,
      appointments: draft.appointments
        .filter((item) => item.date >= from && item.date <= last)
        .map(slim),
    };
  }

  function activity(title: string, href: string) {
    if (!state.value) return;
    const id = crypto.randomUUID();
    state.value.activity.unshift({ id, title, href, createdAt: now() });
    state.value.activity = state.value.activity.slice(0, 250);
    if (state.value.preferences.notify) {
      state.value.notifications.unshift({ id, title, href, read: false });
      state.value.notifications = state.value.notifications.slice(0, 50);
    }
  }
  function upsert<T extends { id: string }>(items: T[], record: T) {
    const index = items.findIndex((item) => item.id === record.id);
    if (index === -1) items.unshift(record);
    else items.splice(index, 1, record);
  }
  const patientName = (id: string) => {
    const patient = state.value?.patients.find((item) => item.id === id);
    return patient ? fullName(patient) : "Patient";
  };

  /** Waitlisted patients who could take the opening a visit has just left. */
  function waitlistMatches(freed: Appointment) {
    return matchingWaitlist(state.value?.waitlist ?? [], freed);
  }

  async function saveAppointment(record: Appointment) {
    const draft = current();
    const previous = draft.appointments.find((item) => item.id === record.id);
    const saved = await request<Appointment>("/api/demo/appointments/save", {
      record: { ...record, updatedAt: now() },
      previous: previous
        ? { providerId: previous.providerId, date: previous.date, start: previous.start }
        : undefined,
      previousStatus: previous?.status ?? "",
      context: scheduleContext(record.date),
    });
    upsert(current().appointments, saved);
    const verb = !previous
      ? "booked"
      : previous.date !== saved.date || previous.start !== saved.start
        ? "rescheduled"
        : "updated";
    activity(`${patientName(saved.patientId)}'s visit was ${verb}`, "/appointments/" + saved.id);
    return { saved, created: !previous };
  }
  async function setStatus(record: Appointment, status: AppointmentStatus) {
    const saved = await request<Appointment>("/api/demo/appointments/status", {
      record: { ...record, status, updatedAt: now() },
      from: record.status,
      context: scheduleContext(record.date),
    });
    upsert(current().appointments, saved);
    activity(
      `${patientName(saved.patientId)} is ${status.replace("-", " ")}`,
      "/appointments/" + saved.id
    );
    return { saved, matches: holdsSlot(status) ? [] : waitlistMatches(saved) };
  }
  async function bulk(action: BulkAction, ids: string[]) {
    const draft = current();
    const selected = draft.appointments.filter((item) => ids.includes(item.id));
    const result = await request<{ status: AppointmentStatus; ids: string[]; skipped: string[] }>(
      "/api/demo/appointments/bulk",
      { action, items: selected.map((item) => ({ id: item.id, status: item.status })) }
    );
    const set = new Set(result.ids);
    const stamp = now();
    for (const item of current().appointments) {
      if (!set.has(item.id)) continue;
      item.status = result.status;
      item.updatedAt = stamp;
    }
    if (result.ids.length)
      activity(
        `${result.ids.length} ${result.ids.length === 1 ? "visit" : "visits"} ${action === "confirm" ? "confirmed" : "cancelled"}`,
        "/appointments"
      );
    return result;
  }
  async function deleteAppointment(id: string) {
    await request("/api/demo/records/delete", { kind: "appointment", id });
    const draft = current();
    const item = draft.appointments.find((entry) => entry.id === id);
    draft.appointments = draft.appointments.filter((entry) => entry.id !== id);
    draft.notifications = draft.notifications.filter(
      (entry) => entry.href !== "/appointments/" + id
    );
    if (item) activity(`${patientName(item.patientId)}'s visit was deleted`, "/appointments");
  }

  async function savePatient(record: Patient) {
    const draft = current();
    const saved = await request<Patient>("/api/demo/patients/save", {
      record,
      context: {
        providerIds: draft.providers.map((item) => item.id),
        otherEmails: draft.patients
          .filter((item) => item.id !== record.id)
          .map((item) => item.email),
      },
    });
    const existed = draft.patients.some((item) => item.id === saved.id);
    upsert(draft.patients, saved);
    activity(`${fullName(saved)} was ${existed ? "updated" : "added"}`, "/patients/" + saved.id);
    return saved;
  }
  async function deletePatient(id: string) {
    await request("/api/demo/records/delete", { kind: "patient", id });
    const draft = current();
    const patient = draft.patients.find((item) => item.id === id);
    const visitIds = new Set(
      draft.appointments.filter((item) => item.patientId === id).map((item) => item.id)
    );
    draft.patients = draft.patients.filter((item) => item.id !== id);
    draft.appointments = draft.appointments.filter((item) => item.patientId !== id);
    draft.waitlist = draft.waitlist.filter((item) => item.patientId !== id);
    draft.notifications = draft.notifications.filter(
      (item) =>
        item.href !== "/patients/" + id &&
        ![...visitIds].some((v) => item.href === "/appointments/" + v)
    );
    if (patient) activity(`${fullName(patient)} was removed`, "/patients");
  }

  async function saveProvider(record: Provider) {
    const draft = current();
    const saved = await request<Provider>("/api/demo/providers/save", {
      record,
      context: { visitTypeIds: draft.visitTypes.map((item) => item.id) },
    });
    upsert(draft.providers, saved);
    activity(`${saved.name}'s schedule was updated`, "/providers/" + saved.id);
    return saved;
  }

  async function saveWaitlist(record: WaitlistEntry) {
    const draft = current();
    const saved = await request<WaitlistEntry>("/api/demo/waitlist/save", {
      record,
      context: {
        patientIds: draft.patients.map((item) => item.id),
        providerIds: draft.providers.map((item) => item.id),
        visitTypeIds: draft.visitTypes.map((item) => item.id),
      },
    });
    const existed = draft.waitlist.some((item) => item.id === saved.id);
    upsert(draft.waitlist, saved);
    if (!existed) activity(`${patientName(saved.patientId)} joined the waitlist`, "/waitlist");
    return saved;
  }
  async function removeWaitlist(id: string) {
    await request("/api/demo/records/delete", { kind: "waitlist", id });
    const draft = current();
    draft.waitlist = draft.waitlist.filter((item) => item.id !== id);
  }
  /** Books a waitlisted patient into a chosen slot and takes them off the list. */
  async function offerWaitlist(
    entry: WaitlistEntry,
    slot: { providerId: string; date: string; start: string }
  ) {
    const result = await request<{ appointment: Appointment; entryId: string }>(
      "/api/demo/waitlist/offer",
      {
        entry,
        slot,
        id: newId("appointment"),
        now: now(),
        context: scheduleContext(slot.date),
      }
    );
    const draft = current();
    const appointment = { ...result.appointment, reference: referenceFor(result.appointment.id) };
    upsert(draft.appointments, appointment);
    draft.waitlist = draft.waitlist.filter((item) => item.id !== result.entryId);
    activity(
      `${patientName(appointment.patientId)} was booked from the waitlist`,
      "/appointments/" + appointment.id
    );
    return appointment;
  }

  /** Open slots for a visit type, computed by the API from the visits the client knows about. */
  async function loadAvailability(options: {
    visitTypeId: string;
    providerId: string;
    from: string;
    days: number;
    ignoreId?: string;
  }) {
    const result = await request<{ days: DayAvailability[] }>("/api/demo/availability", {
      ...options,
      ignoreId: options.ignoreId ?? "",
      context: scheduleContext(options.from, options.days),
    });
    return result.days;
  }

  /** The public booking flow. A returning patient is matched by email. */
  async function book(booking: BookingRequest) {
    const draft = current();
    const match = draft.patients.find(
      (item) => item.email.toLowerCase() === booking.patient.email.toLowerCase()
    );
    const patientId = match?.id ?? newId("patient");
    const id = newId("appointment");
    const result = await request<{ appointment: Appointment }>("/api/demo/booking/submit", {
      booking,
      id,
      patientId,
      existingPatientId: match?.id ?? "",
      now: now(),
      context: scheduleContext(booking.date),
    });
    const next = current();
    if (!match) {
      next.patients.unshift({
        id: patientId,
        ...booking.patient,
        insurance: "",
        preferredProviderId: "",
        tags: ["New patient"],
        notes: "",
        createdAt: now(),
      });
    }
    upsert(next.appointments, result.appointment);
    activity(
      `${booking.patient.firstName} ${booking.patient.lastName} booked online`,
      "/appointments/" + result.appointment.id
    );
    return { appointment: result.appointment, isNewPatient: !match };
  }

  async function saveSettings(record: SettingsRecord) {
    const saved = await request<SettingsRecord>("/api/demo/settings/save", { record });
    const draft = current();
    draft.profile = saved.profile;
    draft.clinic = saved.clinic;
    draft.preferences = saved.preferences;
    activity("Clinic settings updated", "/settings");
    return saved;
  }
  async function resetDemo() {
    revision.value++;
    controllers.get(app)?.forEach((controller) => controller.abort());
    const fresh = await request<DemoState>("/api/demo/bootstrap", undefined, "GET");
    state.value = fresh;
    try {
      localStorage.setItem(storageKey, JSON.stringify(fresh));
      storageWarning.value = "";
    } catch {
      storageWarning.value = "Browser storage is unavailable. Changes last for this visit only.";
    }
  }

  return {
    state,
    ready,
    storageWarning,
    revision,
    request,
    scheduleContext,
    patientName,
    waitlistMatches,
    saveAppointment,
    setStatus,
    bulk,
    deleteAppointment,
    savePatient,
    deletePatient,
    saveProvider,
    saveWaitlist,
    removeWaitlist,
    offerWaitlist,
    loadAvailability,
    book,
    saveSettings,
    resetDemo,
  };
}
