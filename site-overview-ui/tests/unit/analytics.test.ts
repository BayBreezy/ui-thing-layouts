import { describe, expect, it } from "vitest";

import {
  emptyFilters,
  isBounce,
  matchesSegment,
  normalizeQuery,
  runReport,
} from "../../shared/analytics";
import { csvCell, pagesCsv, rankedCsv } from "../../shared/csv";
import {
  addDays,
  dataStart,
  daysBetween,
  eachDay,
  isDate,
  previousRange,
  resolveRange,
  weekStart,
} from "../../shared/dates";
import {
  formatChange,
  formatCompact,
  formatDuration,
  formatMetric,
  formatRange,
  pctChange,
} from "../../shared/format";
import { liveEvent, liveVisitors } from "../../shared/live";
import { referenceDate } from "../../shared/types";
import type { Dataset, Goal, ReportQuery, Session, Site } from "../../shared/types";

const pages = [
  { path: "/", title: "Home" },
  { path: "/shop", title: "Shop" },
  { path: "/thanks", title: "Thanks" },
];
let visitor = 0;
function session(over: Partial<Session> = {}): Session {
  return {
    d: "2026-10-10",
    h: 10,
    ch: "organic",
    dv: "desktop",
    co: "US",
    br: "Chrome",
    v: ++visitor,
    rt: false,
    pg: [0],
    du: 20,
    rf: "",
    cp: "",
    ev: [],
    ...over,
  };
}
const goals: Goal[] = [
  { id: "g-buy", siteId: "s", name: "Purchase", kind: "pageview", match: "/thanks" },
  { id: "g-cart", siteId: "s", name: "Cart", kind: "event", match: "add_to_cart" },
];
const query = (over: Partial<ReportQuery> = {}): ReportQuery => ({
  siteId: "s",
  from: "2026-10-10",
  to: "2026-10-12",
  compare: false,
  segment: "all",
  filters: emptyFilters(),
  interval: "day",
  ...over,
});
const options = { goals, funnel: ["g-cart", "g-buy"] };
const run = (sessions: Session[], q: Partial<ReportQuery> = {}) =>
  runReport({ pages, sessions } satisfies Dataset, query(q), options);

describe("date helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("counts whole days between dates", () => {
    expect(daysBetween("2026-10-01", "2026-10-13")).toBe(12);
    expect(daysBetween("2026-10-13", "2026-10-01")).toBe(-12);
  });
  it("finds the Monday that starts a week", () => {
    expect(weekStart("2026-10-13")).toBe("2026-10-12");
    expect(weekStart("2026-10-11")).toBe("2026-10-05");
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
  });
  it("lists every day of a range, inclusive", () => {
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(eachDay("2026-10-02", "2026-10-01")).toEqual([]);
  });
  it("rejects dates that are not real", () => {
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("2026-13-01")).toBe(false);
    expect(isDate("10/13/2026")).toBe(false);
    expect(isDate("2026-10-13")).toBe(true);
  });
  it("resolves presets against the demo day", () => {
    expect(resolveRange({ preset: "today", from: "", to: "" })).toEqual({
      from: referenceDate,
      to: referenceDate,
    });
    expect(resolveRange({ preset: "7d", from: "", to: "" })).toEqual({
      from: "2026-10-07",
      to: referenceDate,
    });
    expect(resolveRange({ preset: "30d", from: "", to: "" }).from).toBe("2026-09-14");
  });
  it("swaps and clamps custom ranges so a hand-edited URL cannot ask for the future", () => {
    expect(resolveRange({ preset: "custom", from: "2026-10-12", to: "2026-10-01" })).toEqual({
      from: "2026-10-01",
      to: "2026-10-12",
    });
    expect(resolveRange({ preset: "custom", from: "2026-10-01", to: "2030-01-01" }).to).toBe(
      referenceDate
    );
    expect(resolveRange({ preset: "custom", from: "2000-01-01", to: "2026-10-01" }).from).toBe(
      dataStart
    );
    expect(resolveRange({ preset: "custom", from: "nonsense", to: "" }).to).toBe(referenceDate);
  });
  it("builds a previous period of equal length", () => {
    expect(previousRange("2026-10-08", "2026-10-14")).toEqual({
      from: "2026-10-01",
      to: "2026-10-07",
    });
    expect(previousRange("2026-10-13", "2026-10-13")).toEqual({
      from: "2026-10-12",
      to: "2026-10-12",
    });
  });
});

describe("formatting and change", () => {
  it("does not invent a change when there is nothing to compare", () => {
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(10, null)).toBeNull();
    expect(pctChange(0, 0)).toBeNull();
    expect(pctChange(0, 50)).toBe(-100);
    expect(pctChange(112.5, 100)).toBe(12.5);
  });
  it("formats durations, changes and metrics", () => {
    expect(formatDuration(144)).toBe("2:24");
    expect(formatDuration(3723)).toBe("1:02:03");
    expect(formatDuration(-4)).toBe("0:00");
    expect(formatChange(null)).toBe("—");
    expect(formatChange(2.4)).toBe("+2.4%");
    expect(formatChange(-8)).toBe("-8.0%");
    expect(formatMetric("bounceRate", 0.405)).toBe("40.5%");
    expect(formatMetric("sessions", 14904)).toBe("14.9K");
    expect(formatCompact(512)).toBe("512");
  });
  it("describes ranges", () => {
    expect(formatRange("2026-10-13", "2026-10-13")).toBe("Oct 13, 2026");
    expect(formatRange("2026-09-14", "2026-10-13")).toBe("Sep 14 – Oct 13, 2026");
  });
});

describe("reports", () => {
  it("counts sessions, visitors, pageviews, bounce rate and duration", () => {
    const shared = 99;
    const report = run([
      session({ v: shared, pg: [0], du: 10 }),
      session({ v: shared, pg: [0, 1], du: 50 }),
      session({ pg: [0, 1, 1], du: 90 }),
    ]);
    expect(report.totals.sessions).toBe(3);
    expect(report.totals.visitors).toBe(2);
    expect(report.totals.pageviews).toBe(6);
    expect(report.totals.bounceRate).toBeCloseTo(1 / 3);
    expect(report.totals.avgDuration).toBe(50);
    expect(report.totals.pagesPerSession).toBe(2);
  });
  it("treats a single-page visit as a bounce", () => {
    expect(isBounce(session({ pg: [0] }))).toBe(true);
    expect(isBounce(session({ pg: [0, 1] }))).toBe(false);
  });
  it("only counts days inside the range and draws empty days as zero", () => {
    const report = run([
      session({ d: "2026-10-09" }),
      session({ d: "2026-10-10" }),
      session({ d: "2026-10-12" }),
      session({ d: "2026-10-13" }),
    ]);
    expect(report.series.map((point) => point.date)).toEqual([
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
    ]);
    expect(report.series.map((point) => point.sessions)).toEqual([1, 0, 1]);
    expect(report.totals.sessions).toBe(2);
  });
  it("buckets long ranges by week starting on Monday", () => {
    const report = run(
      [session({ d: "2026-09-14" }), session({ d: "2026-09-20" }), session({ d: "2026-09-21" })],
      {
        from: "2026-09-14",
        to: "2026-10-04",
        interval: "week",
      }
    );
    expect(report.series.map((point) => point.date)).toEqual([
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
    ]);
    expect(report.series.map((point) => point.sessions)).toEqual([2, 1, 0]);
  });
  it("chooses day buckets up to 31 days and weeks beyond", () => {
    expect(run([], { from: "2026-09-13", to: "2026-10-13", interval: "auto" }).interval).toBe(
      "day"
    );
    expect(run([], { from: "2026-09-12", to: "2026-10-13", interval: "auto" }).interval).toBe(
      "week"
    );
  });
  it("applies segments", () => {
    const sessions = [
      session({ ch: "direct" }),
      session({ ch: "organic", dv: "mobile" }),
      session({ ch: "paid", rt: true }),
      session({ ch: "organic", dv: "mobile", rt: true }),
    ];
    expect(run(sessions, { segment: "organic" }).totals.sessions).toBe(2);
    expect(run(sessions, { segment: "mobile" }).totals.sessions).toBe(2);
    expect(run(sessions, { segment: "returning" }).totals.sessions).toBe(2);
    expect(run(sessions, { segment: "direct" }).totals.sessions).toBe(1);
    expect(matchesSegment(sessions[0]!, "all")).toBe(true);
  });
  it("cross-filters by channel, device, country and page together", () => {
    const sessions = [
      session({ ch: "organic", dv: "mobile", co: "CA", pg: [0, 1] }),
      session({ ch: "organic", dv: "mobile", co: "US", pg: [0, 1] }),
      session({ ch: "organic", dv: "desktop", co: "CA", pg: [0, 1] }),
      session({ ch: "paid", dv: "mobile", co: "CA", pg: [0, 1] }),
      session({ ch: "organic", dv: "mobile", co: "CA", pg: [0] }),
    ];
    const filters = { channel: "organic", device: "mobile", country: "CA", page: "/shop" } as const;
    expect(run(sessions, { filters: { ...filters } }).totals.sessions).toBe(1);
    expect(run(sessions, { filters: { ...filters, page: "" } }).totals.sessions).toBe(2);
    expect(run(sessions, { filters: { ...emptyFilters(), page: "/nope" } }).totals.sessions).toBe(
      0
    );
  });
  it("compares with the previous period and reports changes", () => {
    const report = run(
      [
        session({ d: "2026-10-07" }),
        session({ d: "2026-10-08" }),
        session({ d: "2026-10-10" }),
        session({ d: "2026-10-11" }),
        session({ d: "2026-10-12" }),
        session({ d: "2026-10-12" }),
      ],
      { compare: true }
    );
    expect(report.previousRange).toEqual({ from: "2026-10-07", to: "2026-10-09" });
    expect(report.totals.sessions).toBe(4);
    expect(report.previous?.sessions).toBe(2);
    expect(report.channels[0]?.change).toBe(100);
    expect(report.previousSeries).toHaveLength(3);
  });
  it("says the previous period is unavailable when it starts before the data does", () => {
    const report = run([], { compare: true, from: dataStart, to: addDays(dataStart, 6) });
    expect(report.previousAvailable).toBe(false);
    expect(report.previous).toBeNull();
  });
  it("evaluates page and event goals and a cumulative funnel", () => {
    const sessions = [
      session({ ev: ["add_to_cart"], pg: [0, 1] }),
      session({ ev: ["add_to_cart"], pg: [0, 1, 2] }),
      session({ pg: [0, 2] }),
      session({ pg: [0] }),
    ];
    const report = run(sessions);
    const row = (id: string) => report.goals.find((goal) => goal.goalId === id)!;
    expect(row("g-buy").conversions).toBe(2);
    expect(row("g-cart").conversions).toBe(2);
    expect(row("g-buy").rate).toBe(0.5);
    expect(report.totals.conversions).toBe(3);
    expect(report.funnel.map((step) => step.sessions)).toEqual([4, 2, 1]);
    expect(report.funnel[2]?.rate).toBe(0.25);
  });
  it("ignores goals that belong to another site", () => {
    const other: Goal = {
      id: "x",
      siteId: "other",
      name: "X",
      kind: "event",
      match: "add_to_cart",
    };
    const report = runReport({ pages, sessions: [session({ ev: ["add_to_cart"] })] }, query(), {
      goals: [other],
      funnel: ["x"],
    });
    expect(report.goals).toHaveLength(0);
    expect(report.funnel).toHaveLength(1);
  });
  it("ranks pages with entrances, bounce rate and views", () => {
    const report = run([
      session({ pg: [0, 1], du: 40 }),
      session({ pg: [0], du: 10 }),
      session({ pg: [1, 0], du: 30 }),
    ]);
    const home = report.pages.find((row) => row.path === "/")!;
    expect(home.views).toBe(3);
    expect(home.entrances).toBe(2);
    expect(home.bounceRate).toBe(0.5);
    expect(home.avgDuration).toBe(25);
    expect(report.pages[0]?.path).toBe("/");
    expect(report.pages.every((row) => row.path !== "/thanks")).toBe(true);
  });
  it("gives each ranked dimension shares that add up to one", () => {
    const report = run([
      session({ ch: "direct", co: "US" }),
      session({ ch: "organic", co: "CA" }),
      session({ ch: "organic", co: "GB" }),
    ]);
    expect(report.channels.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
    expect(report.countries).toHaveLength(3);
    expect(report.visitorTypes[0]?.label).toBe("New visitors");
  });
  it("omits empty referrers and campaigns", () => {
    const report = run([session({ rf: "", cp: "" }), session({ rf: "google.com", cp: "autumn" })]);
    expect(report.referrers.map((row) => row.key)).toEqual(["google.com"]);
    expect(report.campaigns.map((row) => row.key)).toEqual(["autumn"]);
  });
  it("normalizes reversed and out-of-window queries", () => {
    const fixed = normalizeQuery(query({ from: "2026-10-12", to: "2026-10-01" }));
    expect([fixed.from, fixed.to]).toEqual(["2026-10-01", "2026-10-12"]);
    expect(normalizeQuery(query({ from: "2026-10-01", to: "2099-01-01" })).to).toBe(referenceDate);
  });
});

describe("exports", () => {
  it("neutralizes spreadsheet formulas and quotes awkward cells", () => {
    expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvCell("+1 555")).toBe("'+1 555");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell(42)).toBe("42");
  });
  it("writes pages and ranked rows with headers", () => {
    const report = run([session({ rf: "=evil.example" })]);
    const csv = pagesCsv(report.pages);
    expect(csv.split("\r\n")[0]).toBe(
      "Path,Title,Pageviews,Visitors,Entrances,Bounce rate,Avg. duration (s)"
    );
    expect(rankedCsv("Referrer", report.referrers)).toContain("'=evil.example");
  });
});

describe("live feed", () => {
  const site: Site = { id: "s", name: "S", domain: "s.example", blurb: "", pages, createdAt: "" };
  it("repeats the same event for the same index", () => {
    expect(liveEvent(site, 5, "t")).toEqual(liveEvent(site, 5, "t"));
    expect(liveEvent(site, 5, "t")).not.toEqual(liveEvent(site, 6, "t"));
  });
  it("only uses pages the site has", () => {
    for (let index = 0; index < 50; index++)
      expect(pages.map((page) => page.path)).toContain(liveEvent(site, index, "t").path);
  });
  it("keeps the visitor count positive and gently varying", () => {
    const counts = Array.from({ length: 30 }, (_, minute) => liveVisitors(site, minute));
    expect(Math.min(...counts)).toBeGreaterThan(0);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThan(15);
  });
});
