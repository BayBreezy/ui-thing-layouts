import { fileURLToPath } from "node:url";

import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

import { createDemoState, datasetFor } from "../../server/utils/fixtures";
import { emptyFilters, runReport } from "../../shared/analytics";
import type { ReportQuery, ReportResult } from "../../shared/types";

await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  browser: false,
  dev: true,
  nuxtConfig: { devtools: { enabled: false } },
});
const seed = createDemoState();
const northwind = seed.sites[0]!;
const post = <T = any>(url: string, body: unknown) =>
  $fetch<T>(url, { method: "POST", body: body as Record<string, unknown> });
const failure = async (url: string, body: unknown) => {
  try {
    await post(url, body);
  } catch (cause) {
    return cause as { statusCode?: number; data?: any };
  }
  throw new Error("expected the request to fail");
};
const query = (over: Partial<ReportQuery> = {}): ReportQuery => ({
  siteId: "northwind",
  from: "2026-09-14",
  to: "2026-10-13",
  compare: true,
  segment: "all",
  filters: emptyFilters(),
  interval: "auto",
  ...over,
});
const report = (q: ReportQuery, goals = seed.goals, funnel = seed.preferences.funnel) =>
  post<ReportResult>("/api/demo/report", {
    query: q,
    site: { id: northwind.id, pages: northwind.pages },
    goals,
    funnel,
  });

describe("demo API", () => {
  it("serves the seeded workspace", async () => {
    const state = await $fetch<typeof seed>("/api/demo/bootstrap");
    expect(state.sites).toHaveLength(3);
    expect(state.goals.length).toBe(seed.goals.length);
    expect(state.preferences.siteId).toBe("northwind");
  });

  it("returns the same report the shared rules produce", async () => {
    const q = query();
    const remote = await report(q);
    const local = runReport(datasetFor(northwind), q, {
      goals: seed.goals,
      funnel: seed.preferences.funnel,
    });
    expect(remote.totals).toEqual(local.totals);
    expect(remote.series).toEqual(local.series);
    expect(remote.interval).toBe("day");
  });

  it("applies segments and filters on the server", async () => {
    const all = await report(query({ compare: false }));
    const organic = await report(query({ compare: false, segment: "organic" }));
    const filtered = await report(
      query({ compare: false, filters: { ...emptyFilters(), country: "CA", device: "mobile" } })
    );
    expect(organic.totals.sessions).toBeLessThan(all.totals.sessions);
    expect(organic.channels.map((row) => row.key)).toEqual(["organic"]);
    expect(filtered.countries.map((row) => row.key)).toEqual(["CA"]);
    expect(filtered.devices.map((row) => row.key)).toEqual(["mobile"]);
  });

  it("clamps a range that reaches into the future", async () => {
    const result = await report(query({ from: "2026-10-10", to: "2099-01-01", compare: false }));
    expect(result.query.to).toBe("2026-10-13");
    expect(result.series.at(-1)?.date).toBe("2026-10-13");
  });

  it("evaluates the goals it is given and builds a funnel", async () => {
    const result = await report(query({ compare: false }));
    expect(result.goals.map((goal) => goal.goalId).sort()).toEqual(
      seed.goals
        .filter((goal) => goal.siteId === "northwind")
        .map((goal) => goal.id)
        .sort()
    );
    expect(result.funnel[0]?.sessions).toBe(result.totals.sessions);
    expect(result.funnel.at(-1)!.sessions).toBeLessThanOrEqual(result.funnel[1]!.sessions);
  });

  it("generates deterministic traffic for a site the visitor adds", async () => {
    const body = {
      query: query({ siteId: "site-new", compare: false }),
      site: {
        id: "site-new",
        pages: [
          { path: "/", title: "Home" },
          { path: "/pricing", title: "Pricing" },
        ],
      },
      goals: [],
      funnel: [],
    };
    const first = await post<ReportResult>("/api/demo/report", body);
    const second = await post<ReportResult>("/api/demo/report", body);
    expect(first.totals.sessions).toBeGreaterThan(500);
    expect(second.totals).toEqual(first.totals);
    expect(first.pages.map((row) => row.path).sort()).toEqual(["/", "/pricing"]);
  });

  it("rejects bad report requests", async () => {
    const badDate = await failure("/api/demo/report", {
      query: query({ from: "2026-02-30" }),
      site: { id: "northwind", pages: [] },
      goals: [],
      funnel: [],
    });
    expect(badDate.statusCode).toBe(400);
    const mismatch = await failure("/api/demo/report", {
      query: query({ siteId: "fernlight" }),
      site: { id: "northwind", pages: [] },
      goals: [],
      funnel: [],
    });
    expect(mismatch.statusCode).toBe(400);
  });

  it("validates goals and checks the site exists", async () => {
    const good = {
      id: "goal-1",
      siteId: "northwind",
      name: "Pricing view",
      kind: "pageview",
      match: "/pricing",
    };
    const ok = await post("/api/demo/goals/save", {
      record: good,
      context: { siteIds: ["northwind"] },
    });
    expect(ok.name).toBe("Pricing view");
    const bad = await failure("/api/demo/goals/save", {
      record: { ...good, match: "pricing" },
      context: { siteIds: ["northwind"] },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.data.data.errors.join(" ")).toMatch(/starts with/);
    const unknown = await failure("/api/demo/goals/save", {
      record: { ...good, siteId: "ghost" },
      context: { siteIds: ["northwind"] },
    });
    expect(unknown.statusCode).toBe(400);
  });

  it("validates sites, reports, settings and deletes", async () => {
    const site = {
      id: "site-2",
      name: "Acme",
      domain: "acme.example",
      blurb: "",
      pages: [{ path: "/", title: "Home" }],
      createdAt: "2026-10-13T10:00:00",
    };
    expect((await post("/api/demo/sites/save", { record: site })).domain).toBe("acme.example");
    expect(
      (await failure("/api/demo/sites/save", { record: { ...site, domain: "not a domain" } }))
        .statusCode
    ).toBe(400);
    const savedReport = {
      id: "report-x",
      siteId: "northwind",
      name: "My view",
      range: { preset: "7d", from: "", to: "" },
      compare: true,
      segment: "all",
      filters: emptyFilters(),
      digest: "weekly",
      createdAt: "2026-10-13T10:00:00",
    };
    expect(
      (
        await post("/api/demo/reports/save", {
          record: savedReport,
          context: { siteIds: ["northwind"] },
        })
      ).name
    ).toBe("My view");
    expect(
      (
        await failure("/api/demo/reports/save", {
          record: { ...savedReport, name: " " },
          context: { siteIds: ["northwind"] },
        })
      ).statusCode
    ).toBe(400);
    const settings = { profile: seed.profile, preferences: seed.preferences };
    expect((await post("/api/demo/settings/save", { record: settings })).profile.name).toBe(
      seed.profile.name
    );
    expect(
      (
        await failure("/api/demo/settings/save", {
          record: { ...settings, profile: { ...seed.profile, email: "nope" } },
        })
      ).statusCode
    ).toBe(400);
    expect(await post("/api/demo/records/delete", { kind: "goal", id: "g" })).toMatchObject({
      deleted: true,
    });
    expect(
      (await failure("/api/demo/records/delete", { kind: "mystery", id: "g" })).statusCode
    ).toBe(400);
  });

  it("handles demo auth without storing anything", async () => {
    const login = await post("/api/demo/auth/login", {
      email: "a@example.com",
      password: "demo-pass-1",
    });
    expect(login.profile.email).toBe("a@example.com");
    expect(JSON.stringify(login)).not.toContain("demo-pass-1");
    expect(
      (await post("/api/demo/auth/forgot-password", { email: "a@example.com" })).resetLink
    ).toContain("/reset-password");
    expect(
      (await failure("/api/demo/auth/login", { email: "a@example.com", password: "short" }))
        .statusCode
    ).toBe(400);
    expect((await failure("/api/demo/auth/unknown", {})).statusCode).toBe(404);
  });
});
