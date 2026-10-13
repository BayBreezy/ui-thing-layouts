import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick } from "vue";

import { useDemo } from "../../app/composables/useDemo";
import { createDemoState } from "../../server/utils/fixtures";
import { holdsSlot } from "../../shared/schedule";
import type { Appointment } from "../../shared/types";
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
mockNuxtImport("$fetch", () => fetchMock);

/** A visit still ahead of the demo clock, so cancelling it frees a slot that matters. */
const upcoming = (items: Appointment[], status: Appointment["status"] = "confirmed") =>
  items.find((item) => item.date > "2026-10-13" && item.status === status)!;

describe("connected workspace mutations", () => {
  beforeEach(() => {
    const demo = useDemo();
    demo.state.value = createDemoState();
    demo.revision.value = 0;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, options: { body: any }) => {
      if (url.endsWith("/appointments/bulk"))
        return {
          status: options.body.action === "confirm" ? "confirmed" : "cancelled",
          ids: options.body.items.map((item: { id: string }) => item.id),
          skipped: [],
        };
      if (url.endsWith("/booking/submit")) {
        const { booking, id, patientId, existingPatientId, now } = options.body;
        return {
          appointment: {
            id,
            reference: "MND-TEST",
            patientId: existingPatientId || patientId,
            providerId: booking.providerId,
            visitTypeId: booking.visitTypeId,
            date: booking.date,
            start: booking.start,
            end: "10:00",
            status: "scheduled",
            reason: booking.reason,
            notes: "",
            source: "online",
            createdAt: now,
            updatedAt: now,
          },
        };
      }
      if (url.endsWith("/waitlist/offer"))
        return {
          appointment: {
            ...upcoming(createDemoState().appointments),
            id: options.body.id,
            patientId: options.body.entry.patientId,
            source: "waitlist",
          },
          entryId: options.body.entry.id,
        };
      return JSON.parse(JSON.stringify(options.body.record ?? options.body));
    });
  });

  it("books a visit and records activity", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    const before = state.appointments.length;
    const template = upcoming(state.appointments);
    const { created } = await demo.saveAppointment({
      ...template,
      id: "new-visit",
      reference: "MND-NEW",
    });
    expect(created).toBe(true);
    expect(state.appointments).toHaveLength(before + 1);
    expect(state.activity[0]!.title).toContain("booked");
    expect(state.notifications[0]!.read).toBe(false);
  });

  it("describes a changed time as a reschedule", async () => {
    const demo = useDemo();
    const visit = upcoming(demo.state.value!.appointments);
    await demo.saveAppointment({ ...visit, start: "09:00", end: "09:20" });
    expect(demo.state.value!.activity[0]!.title).toContain("rescheduled");
  });

  it("moves a visit through its day and keeps counts in step", async () => {
    const demo = useDemo();
    const waiting = computed(
      () =>
        demo.state.value!.appointments.filter(
          (item) => item.date === "2026-10-13" && item.status === "checked-in"
        ).length
    );
    const target = demo.state.value!.appointments.find(
      (item) => item.date === "2026-10-13" && item.status === "confirmed"
    )!;
    const before = waiting.value;
    await demo.setStatus(target, "checked-in");
    await nextTick();
    expect(waiting.value).toBe(before + 1);
    const updated = demo.state.value!.appointments.find((item) => item.id === target.id)!;
    expect(updated.status).toBe("checked-in");
    expect(demo.state.value!.activity[0]!.title).toContain("checked in");
  });

  it("offers waitlisted patients when a visit is cancelled", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    const entry = state.waitlist[0]!;
    const visit = upcoming(state.appointments);
    // Make the cancelled visit one this waitlist entry would take.
    const target = {
      ...visit,
      visitTypeId: entry.visitTypeId,
      providerId: entry.providerId || visit.providerId,
    };
    state.appointments.splice(state.appointments.indexOf(visit), 1, target);
    const { matches } = await demo.setStatus(target, "cancelled");
    expect(matches.map((item) => item.id)).toContain(entry.id);
    expect(holdsSlot(state.appointments.find((item) => item.id === target.id)!.status)).toBe(false);
    // Confirming does not suggest anything.
    const other = upcoming(state.appointments, "scheduled");
    expect((await demo.setStatus(other, "confirmed")).matches).toEqual([]);
  });

  it("applies bulk changes only to the chosen visits", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    const chosen = state.appointments.filter((item) => item.status === "scheduled").slice(0, 3);
    const untouched = state.appointments.find(
      (item) => item.status === "scheduled" && !chosen.includes(item)
    )!;
    await demo.bulk(
      "confirm",
      chosen.map((item) => item.id)
    );
    for (const item of chosen)
      expect(state.appointments.find((x) => x.id === item.id)!.status).toBe("confirmed");
    expect(state.appointments.find((item) => item.id === untouched.id)!.status).toBe("scheduled");
  });

  it("removes a patient together with their visits and waitlist entries", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    const id = state.appointments[0]!.patientId;
    // Give this patient a waitlist entry too, so all three kinds of record are involved.
    state.waitlist.push({ ...state.waitlist[0]!, id: "waitlist-extra", patientId: id });
    expect(state.appointments.filter((item) => item.patientId === id).length).toBeGreaterThan(0);
    expect(state.waitlist.some((item) => item.patientId === id)).toBe(true);
    await demo.deletePatient(id);
    expect(state.patients.some((item) => item.id === id)).toBe(false);
    expect(state.appointments.some((item) => item.patientId === id)).toBe(false);
    expect(state.waitlist.some((item) => item.patientId === id)).toBe(false);
  });

  it("books online as a returning patient or creates a new one", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    const returning = state.patients[0]!;
    const base = {
      visitTypeId: "visit-follow-up",
      providerId: "provider-1",
      date: "2026-10-15",
      start: "09:00",
      reason: "Cough",
    };
    const patientsBefore = state.patients.length;
    const again = await demo.book({
      ...base,
      patient: {
        firstName: returning.firstName,
        lastName: returning.lastName,
        email: returning.email.toUpperCase(),
        phone: returning.phone,
        birthday: "",
      },
    });
    expect(again.isNewPatient).toBe(false);
    expect(again.appointment.patientId).toBe(returning.id);
    expect(state.patients).toHaveLength(patientsBefore);
    const fresh = await demo.book({
      ...base,
      patient: {
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@example.com",
        phone: "(415) 555-0123",
        birthday: "",
      },
    });
    expect(fresh.isNewPatient).toBe(true);
    expect(state.patients).toHaveLength(patientsBefore + 1);
    expect(state.appointments.some((item) => item.id === fresh.appointment.id)).toBe(true);
  });

  it("books a waitlisted patient and takes them off the list", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    const entry = state.waitlist[0]!;
    const before = state.waitlist.length;
    const visit = await demo.offerWaitlist(entry, {
      providerId: "provider-1",
      date: "2026-10-15",
      start: "09:00",
    });
    expect(visit.source).toBe("waitlist");
    expect(state.waitlist).toHaveLength(before - 1);
    expect(state.appointments.some((item) => item.id === visit.id)).toBe(true);
  });

  it("preserves a record when the API fails", async () => {
    const demo = useDemo();
    const visit = upcoming(demo.state.value!.appointments);
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(demo.saveAppointment({ ...visit, reason: "Unconfirmed" })).rejects.toThrow(
      "offline"
    );
    expect(demo.state.value!.appointments.find((item) => item.id === visit.id)!.reason).toBe(
      visit.reason
    );
  });

  it("prevents an old mutation from writing after reset even if transport ignores abort", async () => {
    const demo = useDemo();
    let complete!: (value: unknown) => void;
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/demo/bootstrap"
        ? createDemoState()
        : new Promise((resolve) => {
            complete = resolve;
          })
    );
    const visit = upcoming(demo.state.value!.appointments);
    const proposed = { ...visit, reason: "Stale change" };
    const caught = demo.saveAppointment(proposed).catch((error) => error);
    await demo.resetDemo();
    complete(proposed);
    expect((await caught).message).toContain("reset");
    expect(demo.state.value!.appointments.find((item) => item.id === visit.id)!.reason).not.toBe(
      "Stale change"
    );
  });
});
