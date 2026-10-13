import { fileURLToPath } from "node:url";

import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

import { createDemoState } from "../../server/utils/fixtures";
import { firstAvailable, referenceFor, slim } from "../../shared/schedule";
import type { Appointment, ScheduleContext } from "../../shared/types";

await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  browser: false,
  dev: true,
  nuxtConfig: { devtools: { enabled: false } },
});
const seed = createDemoState();
const post = <T = any>(url: string, body: unknown) =>
  $fetch<T>(url, { method: "POST", body: body as Record<string, unknown> });
const context = (from?: string, days = 60): ScheduleContext => ({
  providers: seed.providers,
  visitTypes: seed.visitTypes.map((item) => ({ id: item.id, minutes: item.minutes })),
  patientIds: seed.patients.map((item) => item.id),
  slotMinutes: seed.clinic.slotMinutes,
  appointments: seed.appointments
    .filter((item) => !from || (item.date >= from && item.date <= addDaysIso(from, days)))
    .map(slim),
});
function addDaysIso(date: string, days: number) {
  return new Date(Date.parse(date + "T00:00:00Z") + days * 86_400_000).toISOString().slice(0, 10);
}
/** An open slot for a follow-up visit with the first provider, from tomorrow on. */
function openSlot() {
  const visitType = seed.visitTypes.find((item) => item.id === "visit-follow-up")!;
  const slot = firstAvailable({
    visitType,
    providerId: "provider-1",
    from: "2026-10-14",
    days: 14,
    context: context(),
  });
  if (!slot) throw new Error("expected an open slot");
  return { slot, visitType };
}
const end20 = (start: string) => {
  const [hours, minutes] = start.split(":").map(Number);
  const total = hours! * 60 + minutes! + 20;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
function appointmentFor(patientId: string, over: Partial<Appointment> = {}): Appointment {
  const { slot, visitType } = openSlot();
  const [hours, minutes] = slot.start.split(":").map(Number);
  const endMinutes = hours! * 60 + minutes! + visitType.minutes;
  const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  return {
    id: "api-test-visit",
    reference: referenceFor("api-test-visit"),
    patientId,
    providerId: slot.providerId,
    visitTypeId: visitType.id,
    date: slot.date,
    start: slot.start,
    end,
    status: "scheduled",
    reason: "Test",
    notes: "",
    source: "staff",
    createdAt: "2026-10-13T10:00:00",
    updatedAt: "2026-10-13T10:00:00",
    ...over,
  };
}
const errorsOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error: any) {
    return {
      status: error.statusCode as number,
      errors: (error.data?.data?.errors ?? []) as string[],
    };
  }
  throw new Error("expected the request to fail");
};

describe("stateless Nitro API", () => {
  it("returns a populated seed and never retains visitor mutations", async () => {
    const first = await $fetch("/api/demo/bootstrap");
    expect(first.appointments.length).toBe(seed.appointments.length);
    first.profile.name = "Edited";
    expect((await $fetch("/api/demo/bootstrap")).profile.name).toBe("Jordan Ellis");
  });

  it("accepts a valid booking and returns it unchanged", async () => {
    const record = appointmentFor(seed.patients[0]!.id);
    const saved = await post("/api/demo/appointments/save", {
      record,
      context: context(record.date, 1),
    });
    expect(saved.id).toBe(record.id);
    expect(saved.start).toBe(record.start);
    expect(
      (await $fetch("/api/demo/bootstrap")).appointments.some((item) => item.id === record.id)
    ).toBe(false);
  });

  it("rejects double-booking a provider or a patient", async () => {
    const taken = seed.appointments.find(
      (item) => item.date > "2026-10-13" && item.status === "confirmed"
    )!;
    const record = appointmentFor(seed.patients[0]!.id, {
      providerId: taken.providerId,
      visitTypeId: taken.visitTypeId,
      date: taken.date,
      start: taken.start,
      end: taken.end,
    });
    const result = await errorsOf(
      post("/api/demo/appointments/save", { record, context: context(taken.date, 1) })
    );
    expect(result.status).toBe(400);
    expect(result.errors.join(" ")).toMatch(/already has a visit/);
    // The same patient cannot be in two rooms at once either.
    const elsewhere = seed.providers.find((item) => item.id !== taken.providerId)!;
    const patientClash = await errorsOf(
      post("/api/demo/appointments/save", {
        record: {
          ...record,
          patientId: taken.patientId,
          providerId: elsewhere.id,
          visitTypeId: elsewhere.visitTypeIds[0],
        },
        context: context(taken.date, 1),
      })
    );
    expect(patientClash.status).toBe(400);
  });

  it("rejects bookings outside hours, in the past, or with dangling references", async () => {
    const base = appointmentFor(seed.patients[0]!.id);
    const ctx = context(base.date, 1);
    for (const [change, pattern] of [
      [{ start: "03:00", end: "03:20" }, /outside/],
      [{ date: "2026-10-12" }, /not working|already passed/],
      [{ patientId: "ghost" }, /Choose a patient/],
      [{ providerId: "ghost" }, /Choose a provider/],
      [{ end: "23:00" }, /takes/],
    ] as const) {
      const result = await errorsOf(
        post("/api/demo/appointments/save", { record: { ...base, ...change }, context: ctx })
      );
      expect(result.status).toBe(400);
      expect(result.errors.join(" ")).toMatch(pattern);
    }
    const malformed = await errorsOf(
      post("/api/demo/appointments/save", { record: { ...base, date: "2026-13-40" }, context: ctx })
    );
    expect(malformed.status).toBe(400);
  });

  it("only allows legal status changes and re-checks the slot when reinstating", async () => {
    const visit = seed.appointments.find(
      (item) => item.date > "2026-10-13" && item.status === "scheduled"
    )!;
    const ok = await post("/api/demo/appointments/status", {
      record: { ...visit, status: "confirmed" },
      from: "scheduled",
      context: context(visit.date, 1),
    });
    expect(ok.status).toBe("confirmed");
    const illegal = await errorsOf(
      post("/api/demo/appointments/status", {
        record: { ...visit, status: "completed" },
        from: "scheduled",
        context: context(visit.date, 1),
      })
    );
    expect(illegal.status).toBe(400);
    // A cancelled visit whose slot has since been taken cannot simply be reinstated.
    const cancelled = { ...visit, id: "cancelled-copy", status: "cancelled" as const };
    const taken = await errorsOf(
      post("/api/demo/appointments/status", {
        record: { ...cancelled, status: "scheduled" },
        from: "cancelled",
        context: context(visit.date, 1),
      })
    );
    expect(taken.errors.join(" ")).toMatch(/already has a visit|patient already/);
  });

  it("applies bulk actions only where the transition is legal", async () => {
    const result = await post("/api/demo/appointments/bulk", {
      action: "confirm",
      items: [
        { id: "a", status: "scheduled" },
        { id: "b", status: "confirmed" },
        { id: "c", status: "completed" },
      ],
    });
    expect(result.ids).toEqual(["a"]);
    expect(result.skipped).toEqual(["b", "c"]);
    expect(
      (
        await post("/api/demo/appointments/bulk", {
          action: "cancel",
          items: [{ id: "a", status: "confirmed" }],
        })
      ).ids
    ).toEqual(["a"]);
    expect(
      (
        await errorsOf(
          post("/api/demo/appointments/bulk", {
            action: "explode",
            items: [{ id: "a", status: "scheduled" }],
          })
        )
      ).status
    ).toBe(400);
  });

  it("computes availability that excludes taken slots", async () => {
    const { slot } = openSlot();
    const body = {
      visitTypeId: "visit-follow-up",
      providerId: "provider-1",
      from: slot.date,
      days: 1,
      context: context(slot.date, 1),
    };
    const free = await post("/api/demo/availability", body);
    expect(free.days[0].slots.some((item: any) => item.start === slot.start)).toBe(true);
    const held = {
      ...context(slot.date, 1),
      appointments: [
        ...context(slot.date, 1).appointments,
        {
          id: "x",
          patientId: "p",
          providerId: "provider-1",
          date: slot.date,
          start: slot.start,
          end: end20(slot.start),
          status: "confirmed",
        },
      ],
    };
    const blocked = await post("/api/demo/availability", { ...body, context: held });
    expect(blocked.days[0].slots.some((item: any) => item.start === slot.start)).toBe(false);
    expect(
      (await errorsOf(post("/api/demo/availability", { ...body, visitTypeId: "mystery" }))).status
    ).toBe(400);
  });

  it("books online, matching the booking's slot and refusing a taken one", async () => {
    const { slot, visitType } = openSlot();
    const booking = {
      visitTypeId: visitType.id,
      providerId: "",
      date: slot.date,
      start: slot.start,
      reason: "Cough",
      patient: {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "(415) 555-0199",
        birthday: "",
      },
    };
    const request = {
      booking,
      id: "online-1",
      patientId: "patient-online-1",
      existingPatientId: "",
      now: "2026-10-13T10:41:00",
      context: context(slot.date, 1),
    };
    const result = await post("/api/demo/booking/submit", request);
    expect(result.appointment).toMatchObject({
      source: "online",
      status: "scheduled",
      date: slot.date,
      start: slot.start,
    });
    expect(result.appointment.providerId).toBeTruthy();
    // The same slot, now held by someone else, is refused.
    const heldContext = {
      ...request.context,
      appointments: [...request.context.appointments, slim(result.appointment)],
    };
    const taken = await errorsOf(
      post("/api/demo/booking/submit", {
        ...request,
        id: "online-2",
        booking: { ...booking, providerId: result.appointment.providerId },
        context: heldContext,
      })
    );
    expect(taken.status).toBe(400);
    expect(
      (
        await errorsOf(
          post("/api/demo/booking/submit", {
            ...request,
            booking: { ...booking, patient: { ...booking.patient, email: "nope" } },
          })
        )
      ).status
    ).toBe(400);
  });

  it("books a waitlisted patient into a chosen slot", async () => {
    const { slot } = openSlot();
    const entry = seed.waitlist.find((item) => item.visitTypeId === "visit-follow-up")!;
    const result = await post("/api/demo/waitlist/offer", {
      entry,
      slot,
      id: "from-waitlist",
      now: "2026-10-13T10:41:00",
      context: context(slot.date, 1),
    });
    expect(result.appointment).toMatchObject({
      source: "waitlist",
      status: "confirmed",
      patientId: entry.patientId,
    });
    expect(result.entryId).toBe(entry.id);
  });

  it("validates patients, providers, waitlist entries and settings", async () => {
    const patient = seed.patients[0]!;
    const providerIds = seed.providers.map((item) => item.id);
    const base = { providerIds, otherEmails: seed.patients.slice(1).map((item) => item.email) };
    expect((await post("/api/demo/patients/save", { record: patient, context: base })).id).toBe(
      patient.id
    );
    const duplicate = await errorsOf(
      post("/api/demo/patients/save", {
        record: patient,
        context: { ...base, otherEmails: [patient.email.toUpperCase()] },
      })
    );
    expect(duplicate.errors.join(" ")).toMatch(/already exists/);
    expect(
      (
        await errorsOf(
          post("/api/demo/patients/save", { record: { ...patient, phone: "abc" }, context: base })
        )
      ).status
    ).toBe(400);

    const provider = seed.providers[0]!;
    const visitTypeIds = seed.visitTypes.map((item) => item.id);
    expect(
      (await post("/api/demo/providers/save", { record: provider, context: { visitTypeIds } })).id
    ).toBe(provider.id);
    expect(
      (
        await errorsOf(
          post("/api/demo/providers/save", {
            record: { ...provider, visitTypeIds: ["nope"] },
            context: { visitTypeIds },
          })
        )
      ).status
    ).toBe(400);

    const entry = seed.waitlist[0]!;
    const waitlistContext = {
      patientIds: seed.patients.map((item) => item.id),
      providerIds,
      visitTypeIds,
    };
    expect(
      (await post("/api/demo/waitlist/save", { record: entry, context: waitlistContext })).id
    ).toBe(entry.id);
    expect(
      (
        await errorsOf(
          post("/api/demo/waitlist/save", {
            record: { ...entry, patientId: "ghost" },
            context: waitlistContext,
          })
        )
      ).status
    ).toBe(400);

    const settings = { profile: seed.profile, clinic: seed.clinic, preferences: seed.preferences };
    expect((await post("/api/demo/settings/save", { record: settings })).clinic.name).toBe(
      seed.clinic.name
    );
    expect(
      (
        await errorsOf(
          post("/api/demo/settings/save", {
            record: { ...settings, clinic: { ...seed.clinic, slotMinutes: 7 } },
          })
        )
      ).status
    ).toBe(400);
  });

  it("acknowledges deletions and rejects unknown kinds", async () => {
    expect(await post("/api/demo/records/delete", { kind: "waitlist", id: "w1" })).toEqual({
      kind: "waitlist",
      id: "w1",
      deleted: true,
    });
    expect(
      (await errorsOf(post("/api/demo/records/delete", { kind: "database", id: "x" }))).status
    ).toBe(400);
  });

  it("validates demo auth without returning passwords", async () => {
    const login = await post("/api/demo/auth/login", {
      email: "ada@example.com",
      password: "demo-password",
    });
    expect(login.simulated).toBe(true);
    expect(JSON.stringify(login)).not.toContain("demo-password");
    expect(
      (
        await errorsOf(
          post("/api/demo/auth/signup", { name: "A", email: "bad", password: "short" })
        )
      ).status
    ).toBe(400);
    expect(
      (await post("/api/demo/auth/forgot-password", { email: "ada@example.com" })).resetLink
    ).toContain("/reset-password");
    expect((await errorsOf(post("/api/demo/auth/hack", {}))).status).toBe(404);
  });
});
