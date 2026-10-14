import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { useDemo } from "../../app/composables/useDemo";
import { applyParams, readParams, toParams } from "../../app/composables/useReportQuery";
import { createDemoState } from "../../server/utils/fixtures";
import type { Goal } from "../../shared/types";
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
mockNuxtImport("$fetch", () => fetchMock);

const goal = (over: Partial<Goal> = {}): Goal => ({
  id: "goal-test",
  siteId: "northwind",
  name: "Pricing view",
  kind: "pageview",
  match: "/pricing",
  ...over,
});

describe("workspace mutations", () => {
  beforeEach(() => {
    const demo = useDemo();
    demo.state.value = createDemoState();
    demo.revision.value = 0;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, options: { body: any }) => {
      if (url.endsWith("/bootstrap")) return createDemoState();
      return JSON.parse(JSON.stringify(options.body.record ?? options.body));
    });
  });

  it("adds a goal and tells the inbox", async () => {
    const demo = useDemo();
    const before = demo.state.value!.goals.length;
    const notes = demo.state.value!.notifications.length;
    await demo.saveGoal(goal());
    expect(demo.state.value!.goals).toHaveLength(before + 1);
    expect(demo.state.value!.notifications).toHaveLength(notes + 1);
    expect(demo.state.value!.notifications[0]!.title).toContain("Pricing view");
  });

  it("updates a goal in place instead of duplicating it", async () => {
    const demo = useDemo();
    await demo.saveGoal(goal());
    await demo.saveGoal(goal({ name: "Pricing page" }));
    const matches = demo.state.value!.goals.filter((item) => item.id === "goal-test");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.name).toBe("Pricing page");
  });

  it("removes a goal from the funnel when it is deleted", async () => {
    const demo = useDemo();
    const id = demo.state.value!.preferences.funnel[0]!;
    await demo.removeGoal(id);
    expect(demo.state.value!.goals.some((item) => item.id === id)).toBe(false);
    expect(demo.state.value!.preferences.funnel).not.toContain(id);
  });

  it("removes a site with everything that belongs to it", async () => {
    const demo = useDemo();
    demo.state.value!.preferences.siteId = "fernlight";
    await demo.removeSite("fernlight");
    const state = demo.state.value!;
    expect(state.sites.some((item) => item.id === "fernlight")).toBe(false);
    expect(state.goals.some((item) => item.siteId === "fernlight")).toBe(false);
    expect(state.reports.some((item) => item.siteId === "fernlight")).toBe(false);
    expect(state.notifications.some((item) => item.siteId === "fernlight")).toBe(false);
    expect(state.preferences.siteId).toBe("northwind");
  });

  it("keeps at least one site", async () => {
    const demo = useDemo();
    const state = demo.state.value!;
    state.sites = state.sites.slice(0, 1);
    await expect(demo.removeSite(state.sites[0]!.id)).rejects.toThrow(/at least one/);
  });

  it("does not change state when the API rejects a save", async () => {
    const demo = useDemo();
    fetchMock.mockRejectedValueOnce({ data: { statusMessage: "Please check your input" } });
    const before = demo.state.value!.goals.length;
    await expect(demo.saveGoal(goal())).rejects.toBeDefined();
    expect(demo.state.value!.goals).toHaveLength(before);
  });

  it("drops late responses after a reset", async () => {
    const demo = useDemo();
    let release: (value: unknown) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (release = resolve)));
    const pending = demo.saveGoal(goal({ id: "late" }));
    const settled = pending.catch((cause: Error) => cause.message);
    demo.revision.value++;
    release(goal({ id: "late" }));
    expect(await settled).toMatch(/reset/);
    await nextTick();
    expect(demo.state.value!.goals.some((item) => item.id === "late")).toBe(false);
  });

  it("resets to the seed", async () => {
    const demo = useDemo();
    await demo.saveGoal(goal());
    await demo.resetDemo();
    expect(demo.state.value!.goals.some((item) => item.id === "goal-test")).toBe(false);
  });
});

describe("report parameters", () => {
  it("leaves defaults out of the URL and reads them back", () => {
    const state = createDemoState();
    expect(toParams(state.preferences, "northwind")).toEqual({});
    state.preferences.range = { preset: "custom", from: "2026-09-21", to: "2026-09-27" };
    state.preferences.segment = "paid";
    state.preferences.filters.device = "mobile";
    state.preferences.compare = false;
    const params = toParams(state.preferences, "northwind");
    expect(params).toEqual({
      range: "custom",
      from: "2026-09-21",
      to: "2026-09-27",
      compare: "0",
      segment: "paid",
      device: "mobile",
    });
    const fresh = createDemoState();
    applyParams(
      fresh.preferences,
      readParams(params),
      fresh.sites.map((site) => site.id)
    );
    expect(fresh.preferences.range).toEqual(state.preferences.range);
    expect(fresh.preferences.segment).toBe("paid");
    expect(fresh.preferences.filters.device).toBe("mobile");
    expect(fresh.preferences.compare).toBe(false);
  });

  it("ignores values that are not valid", () => {
    const state = createDemoState();
    applyParams(
      state.preferences,
      readParams({
        site: "ghost",
        range: "forever",
        segment: "everyone",
        channel: "tv",
        country: "usa",
        path: "nope",
      }),
      state.sites.map((site) => site.id)
    );
    expect(state.preferences.siteId).toBe("northwind");
    expect(state.preferences.segment).toBe("all");
    expect(state.preferences.filters).toEqual({ channel: "", device: "", country: "", page: "" });
  });
});
