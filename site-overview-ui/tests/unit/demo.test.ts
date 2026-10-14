import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createDemoState, datasetFor } from "../../server/utils/fixtures";
import { emptyFilters, runReport } from "../../shared/analytics";
import { addDays, dataStart } from "../../shared/dates";
import { assertRelationships } from "../../shared/demo";
import { demoStateSchema } from "../../shared/schemas";
import { dataDays, referenceDate, referenceHour } from "../../shared/types";
import type { ReportQuery } from "../../shared/types";

const seed = createDemoState();
const northwind = seed.sites.find((site) => site.id === "northwind")!;
const data = datasetFor(northwind);
const goalOptions = { goals: seed.goals, funnel: seed.preferences.funnel };
const ask = (over: Partial<ReportQuery> = {}) =>
  runReport(
    data,
    {
      siteId: "northwind",
      from: addDays(referenceDate, -29),
      to: referenceDate,
      compare: true,
      segment: "all",
      filters: emptyFilters(),
      interval: "auto",
      ...over,
    },
    goalOptions
  );

describe("seeded demo data", () => {
  it("is identical on every run", () => {
    const again = createDemoState();
    expect(again).toEqual(seed);
    expect(datasetFor(northwind).sessions.length).toBe(data.sessions.length);
    expect(ask().totals).toEqual(ask().totals);
  });
  it("has three sites, goals for each, and a valid default funnel", () => {
    expect(seed.sites.map((site) => site.id)).toEqual(["northwind", "fernlight", "harbor-pine"]);
    for (const site of seed.sites)
      expect(seed.goals.some((goal) => goal.siteId === site.id)).toBe(true);
    expect(seed.preferences.funnel.every((id) => seed.goals.some((goal) => goal.id === id))).toBe(
      true
    );
  });
  it("passes its own schema and relationship checks", () => {
    expect(() => demoStateSchema.validateSync(seed, { strict: true })).not.toThrow();
    expect(() => assertRelationships(seed)).not.toThrow();
  });
  it("covers exactly the data window and stops at the demo clock", () => {
    const days = new Set(data.sessions.map((session) => session.d));
    expect(days.size).toBe(dataDays);
    expect(Math.min(...[...days].map((d) => Date.parse(d)))).toBe(Date.parse(dataStart));
    const today = data.sessions.filter((session) => session.d === referenceDate);
    expect(today.length).toBeGreaterThan(50);
    expect(Math.max(...today.map((session) => session.h))).toBeLessThanOrEqual(referenceHour);
  });
  it("only refers to pages that exist and keeps journeys coherent", () => {
    for (const session of data.sessions.slice(0, 5000)) {
      expect(session.pg.length).toBeGreaterThan(0);
      for (const index of session.pg) expect(data.pages[index]).toBeDefined();
      expect(session.du).toBeGreaterThan(0);
    }
  });
  it("makes every dimension add up to the headline totals", () => {
    const report = ask({ compare: false });
    const sum = (rows: { sessions: number }[]) =>
      rows.reduce((total, row) => total + row.sessions, 0);
    expect(sum(report.channels)).toBe(report.totals.sessions);
    expect(sum(report.devices)).toBe(report.totals.sessions);
    expect(sum(report.countries)).toBe(report.totals.sessions);
    expect(sum(report.visitorTypes)).toBe(report.totals.sessions);
    expect(report.pages.reduce((total, row) => total + row.views, 0)).toBe(report.totals.pageviews);
    expect(report.series.reduce((total, point) => total + point.sessions, 0)).toBe(
      report.totals.sessions
    );
  });
  it("narrows every figure when a filter is applied", () => {
    const all = ask({ compare: false });
    const mobile = ask({ compare: false, filters: { ...emptyFilters(), device: "mobile" } });
    expect(mobile.totals.sessions).toBeLessThan(all.totals.sessions);
    expect(mobile.devices.map((row) => row.key)).toEqual(["mobile"]);
    expect(mobile.totals.sessions).toBe(all.devices.find((row) => row.key === "mobile")!.sessions);
  });
  it("shows the planted stories: a paid surge and a checkout incident", () => {
    const day = (date: string) => ask({ from: date, to: date, compare: false }).totals.sessions;
    expect(day("2026-10-02")).toBeLessThan(day("2026-10-01") * 0.75);
    const paid = (from: string, to: string) =>
      ask({ from, to, compare: false, segment: "paid" }).totals.sessions;
    expect(paid("2026-09-21", "2026-09-27")).toBeGreaterThan(
      paid("2026-09-14", "2026-09-20") * 1.8
    );
  });
  it("keeps volume sane for a small site", () => {
    const harbor = datasetFor(seed.sites.find((site) => site.id === "harbor-pine")!);
    expect(harbor.sessions.length).toBeGreaterThan(5000);
    expect(harbor.sessions.length).toBeLessThan(datasetFor(northwind).sessions.length / 4);
  });
  it("builds notifications from real comparisons", () => {
    expect(seed.notifications.length).toBeGreaterThan(2);
    for (const note of seed.notifications) {
      expect(seed.sites.some((site) => site.id === note.siteId)).toBe(true);
      expect(note.read).toBe(false);
    }
  });
});

describe("snapshot safety", () => {
  it("rejects records that point at things that do not exist", () => {
    const broken = structuredClone(seed);
    broken.goals[0]!.siteId = "ghost";
    expect(() => assertRelationships(broken)).toThrow();
    const noSite = structuredClone(seed);
    noSite.preferences.siteId = "ghost";
    expect(() => assertRelationships(noSite)).toThrow();
    const dup = structuredClone(seed);
    dup.reports.push({ ...dup.reports[0]! });
    expect(() => assertRelationships(dup)).toThrow();
  });
  it("rejects malformed stored data", () => {
    const bad = structuredClone(seed) as any;
    bad.preferences.range.preset = "forever";
    expect(() => demoStateSchema.validateSync(bad, { strict: true })).toThrow();
  });
  it("keeps Faker out of shared code and the app, so the browser never ships it", () => {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]
      );
    const offenders = [...files(join(root, "shared")), ...files(join(root, "app"))].filter(
      (file) => /\.(ts|vue)$/.test(file) && readFileSync(file, "utf8").includes("@faker-js/faker")
    );
    expect(offenders).toEqual([]);
  });
});
