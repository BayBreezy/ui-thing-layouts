import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { restoreSnapshot } from "../../app/utils/persistence";
import { createDemoState } from "../../server/utils/fixtures";
import { assertRelationships } from "../../shared/demo";
import { bookingProblems, holdsSlot, slim } from "../../shared/schedule";
import { demoStateSchema } from "../../shared/schemas";
import { referenceDate } from "../../shared/types";

const seed = createDemoState();

describe("seed data", () => {
  it("is deterministic", () => {
    expect(createDemoState()).toEqual(seed);
  });
  it("is valid and internally consistent", () => {
    expect(() => demoStateSchema.validateSync(seed, { strict: true })).not.toThrow();
    expect(() => assertRelationships(seed)).not.toThrow();
  });
  it("is populated enough to feel real", () => {
    expect(seed.providers).toHaveLength(6);
    expect(seed.visitTypes.length).toBeGreaterThanOrEqual(6);
    expect(seed.patients.length).toBeGreaterThanOrEqual(60);
    expect(seed.appointments.length).toBeGreaterThan(300);
    expect(seed.waitlist).toHaveLength(8);
    expect(seed.notifications.some((item) => !item.read)).toBe(true);
  });
  it("has a believable day today", () => {
    const today = seed.appointments.filter((item) => item.date === referenceDate);
    expect(today.length).toBeGreaterThanOrEqual(25);
    const statuses = new Set(today.map((item) => item.status));
    for (const status of ["completed", "in-progress", "checked-in", "confirmed", "scheduled"])
      expect(statuses.has(status as never)).toBe(true);
    // Nothing is in progress or waiting in the future of the demo clock.
    for (const item of today.filter((entry) => entry.status === "in-progress"))
      expect(item.start <= "10:40" && item.end > "10:40").toBe(true);
    for (const item of today.filter((entry) => entry.status === "completed"))
      expect(item.end <= "10:40").toBe(true);
  });
  it("never double-books a provider or a patient", () => {
    const held = seed.appointments.filter((item) => holdsSlot(item.status));
    for (const key of ["providerId", "patientId"] as const) {
      const groups = new Map<string, typeof held>();
      for (const item of held) {
        const group = `${item[key]}|${item.date}`;
        groups.set(group, [...(groups.get(group) ?? []), item]);
      }
      for (const list of groups.values()) {
        list.sort((a, b) => a.start.localeCompare(b.start));
        for (let i = 1; i < list.length; i++)
          expect(list[i]!.start >= list[i - 1]!.end, `${list[i]!.id} overlaps`).toBe(true);
      }
    }
  });
  it("only schedules visits the rules would accept", () => {
    const context = {
      providers: seed.providers,
      visitTypes: seed.visitTypes,
      patientIds: seed.patients.map((item) => item.id),
      slotMinutes: seed.clinic.slotMinutes,
      appointments: seed.appointments.map(slim),
    };
    const broken = seed.appointments
      .map((item) => ({ item, problems: bookingProblems(item, context) }))
      .filter((entry) => entry.problems.length);
    expect(broken.map((entry) => `${entry.item.id}: ${entry.problems.join(" ")}`)).toEqual([]);
  });
  it("keeps Faker out of shared code", () => {
    const directory = fileURLToPath(new URL("../../shared", import.meta.url));
    for (const file of readdirSync(directory)) {
      expect(readFileSync(`${directory}/${file}`, "utf8")).not.toMatch(/faker/i);
    }
  });
});

describe("persistence", () => {
  it("restores valid snapshots and refuses corrupt ones", () => {
    expect(restoreSnapshot(null)).toBeNull();
    expect(restoreSnapshot(JSON.stringify(seed))?.appointments).toHaveLength(
      seed.appointments.length
    );
    expect(() => restoreSnapshot("{not json")).toThrow();
    expect(() => restoreSnapshot(JSON.stringify({ ...seed, signedIn: "yes" }))).toThrow();
  });
  it("rejects dangling references and duplicate records", () => {
    const dangling = structuredClone(seed);
    dangling.appointments[0]!.providerId = "nobody";
    expect(() => restoreSnapshot(JSON.stringify(dangling))).toThrow();
    const duplicate = structuredClone(seed);
    duplicate.patients.push(duplicate.patients[0]!);
    expect(() => restoreSnapshot(JSON.stringify(duplicate))).toThrow();
    const orphan = structuredClone(seed);
    orphan.waitlist[0]!.patientId = "ghost";
    expect(() => restoreSnapshot(JSON.stringify(orphan))).toThrow();
  });
  it("rejects schedules that cannot be valid", () => {
    const broken = structuredClone(seed);
    broken.providers[0]!.hours[1] = { start: "17:00", end: "09:00", breakStart: "", breakEnd: "" };
    expect(() => restoreSnapshot(JSON.stringify(broken))).toThrow();
  });
});
