import { describe, expect, it } from "vitest";

import { csv } from "../../app/utils/demo";
import { restoreSnapshot } from "../../app/utils/persistence";
import { createDemoState } from "../../server/utils/fixtures";
import { assertRelationships, filteredPerformance, metrics, progress } from "../../shared/demo";
import { campaignSchema, demoStateSchema } from "../../shared/schemas";

describe("reproducible workspace and reporting", () => {
  it("returns a complete, reproducible seed with valid relationships", () => {
    const first = createDemoState();
    expect(first).toEqual(createDemoState());
    expect(first.campaigns).toHaveLength(18);
    expect(first.leads.length).toBeGreaterThan(20);
    expect(() => demoStateSchema.validateSync(first, { strict: true })).not.toThrow();
    expect(() => assertRelationships(first)).not.toThrow();
    expect(new Set(first.campaigns.map((c) => c.status)).size).toBe(3);
  });
  it("uses the same filtered samples for totals and retains archived history", () => {
    const state = createDemoState();
    const samples = filteredPerformance(state, "2026-09-13", "2026-10-12", "Email");
    const total = metrics(samples);
    expect(total.revenue).toBe(samples.reduce((sum, s) => sum + s.revenue, 0));
    expect(
      samples.every((s) => state.campaigns.find((c) => c.id === s.campaignId)?.channel === "Email")
    ).toBe(true);
    state.campaigns
      .filter((c) => c.channel === "Email")
      .forEach((c) => {
        c.archived = true;
      });
    expect(metrics(filteredPerformance(state, "2026-09-13", "2026-10-12", "Email"))).toEqual(total);
    expect(metrics([])).toMatchObject({ revenue: 0, spend: 0, roas: 0, ctr: 0 });
  });
  it("keeps checklist progress separate from status and revenue", () => {
    const state = createDemoState();
    const campaign = state.campaigns[0]!;
    expect(progress(campaign)).toBe(0);
    campaign.checklist[0]!.done = true;
    expect(progress(campaign)).toBe(25);
    expect(campaign.status).toBe("Draft");
    expect(
      metrics(filteredPerformance(state, "2026-07-01", "2026-10-12", "", campaign.id)).revenue
    ).toBe(0);
  });
  it("rejects invalid dates, date order, and negative budgets", () => {
    const record = createDemoState().campaigns[0]!;
    expect(() => campaignSchema.validateSync({ ...record, startDate: "2026-02-30" })).toThrow();
    expect(() => campaignSchema.validateSync({ ...record, startDate: "2026-13-01" })).toThrow();
    expect(() => campaignSchema.validateSync({ ...record, endDate: "2026-01-01" })).toThrow();
    expect(() => campaignSchema.validateSync({ ...record, budget: -1 })).toThrow();
  });
});
describe("snapshot restoration and export", () => {
  it("restores edits and rejects corruption, incompatible versions, and dangling references", () => {
    const state = createDemoState();
    state.campaigns[0]!.name = "My edited campaign";
    expect(restoreSnapshot(JSON.stringify(state))?.campaigns[0]!.name).toBe("My edited campaign");
    expect(restoreSnapshot(null)).toBeNull();
    expect(() => restoreSnapshot("{broken")).toThrow();
    expect(() => restoreSnapshot(JSON.stringify({ ...state, version: 2 }))).toThrow();
    state.leads[0]!.campaignId = "unknown";
    expect(() => restoreSnapshot(JSON.stringify(state))).toThrow();
  });
  it("quotes CSV and guards user values from spreadsheet formulas", () => {
    expect(csv([["=SUM(A1)", 'Hello "studio"', "One,\ntwo", 3]])).toBe(
      '"\'=SUM(A1)","Hello ""studio""","One,\ntwo","3"'
    );
  });
});
