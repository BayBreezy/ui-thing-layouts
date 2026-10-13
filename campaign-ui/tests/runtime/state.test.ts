import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick } from "vue";

import { useDemo } from "../../app/composables/useDemo";
import { createDemoState } from "../../server/utils/fixtures";
import { metrics } from "../../shared/demo";
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
mockNuxtImport("$fetch", () => fetchMock);
describe("connected workspace mutations", () => {
  beforeEach(() => {
    const demo = useDemo();
    demo.state.value = createDemoState();
    demo.revision.value = 0;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (_url, options) =>
      JSON.parse(JSON.stringify(options.body.record))
    );
  });
  it("updates reactive views, activity, notifications, and archive without changing metrics", async () => {
    const demo = useDemo();
    const count = computed(() => demo.state.value!.campaigns.filter((c) => !c.archived).length);
    const original = count.value;
    const total = metrics(demo.state.value!.performance);
    await demo.saveCampaign({ ...demo.state.value!.campaigns[0]!, archived: true });
    await nextTick();
    expect(count.value).toBe(original - 1);
    expect(demo.state.value!.activity[0]!.title).toContain("archived");
    expect(demo.state.value!.notifications[0]!.read).toBe(false);
    expect(metrics(demo.state.value!.performance)).toEqual(total);
    await demo.saveCampaign({ ...demo.state.value!.campaigns[0]!, archived: false });
    expect(count.value).toBe(original);
  });
  it("duplicates as a new draft with no inherited performance", async () => {
    const demo = useDemo();
    const duplicate = await demo.duplicateCampaign(demo.state.value!.campaigns[6]!);
    expect(duplicate.status).toBe("Draft");
    expect(duplicate.checklist.every((t) => !t.done)).toBe(true);
    expect(demo.state.value!.performance.some((s) => s.campaignId === duplicate.id)).toBe(false);
    expect(demo.state.value!.campaigns[0]!.id).toBe(duplicate.id);
  });
  it("preserves a record when the API fails", async () => {
    const demo = useDemo();
    const name = demo.state.value!.campaigns[0]!.name;
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(
      demo.saveCampaign({ ...demo.state.value!.campaigns[0]!, name: "Unconfirmed" })
    ).rejects.toThrow("offline");
    expect(demo.state.value!.campaigns[0]!.name).toBe(name);
  });
  it("prevents an old mutation from writing after reset even if transport ignores abort", async () => {
    const demo = useDemo();
    let complete!: (value: unknown) => void;
    fetchMock.mockImplementation(async (url) =>
      url === "/api/demo/bootstrap"
        ? createDemoState()
        : new Promise((resolve) => {
            complete = resolve;
          })
    );
    const proposed = { ...demo.state.value!.campaigns[0]!, name: "Stale change" };
    const mutation = demo.saveCampaign(proposed);
    const caught = mutation.catch((error) => error);
    await demo.resetDemo();
    complete(proposed);
    expect((await caught).message).toContain("reset");
    expect(demo.state.value!.campaigns[0]!.name).not.toBe("Stale change");
  });
  it("keeps lead/document links connected to a browser-created campaign", async () => {
    const demo = useDemo();
    const campaign = {
      ...demo.state.value!.campaigns[0]!,
      id: "local-campaign",
      name: "Local campaign",
    };
    await demo.saveCampaign(campaign);
    const lead = await demo.saveLead({ ...demo.state.value!.leads[0]!, campaignId: campaign.id });
    const brief = await demo.saveBrief({
      ...demo.state.value!.documents[0]!,
      campaignId: campaign.id,
    });
    expect(lead.campaignId).toBe(brief.campaignId);
    expect(demo.context.value.campaignIds).toContain(campaign.id);
  });
});
