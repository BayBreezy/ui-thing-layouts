import { fileURLToPath } from "node:url";

import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

import { createDemoState } from "../../server/utils/fixtures";
await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  browser: false,
  dev: true,
  nuxtConfig: { devtools: { enabled: false } },
});
const seed = createDemoState();
const context = {
  memberIds: seed.members.map((m) => m.id),
  campaignIds: seed.campaigns.map((c) => c.id),
};
describe("stateless Nitro API", () => {
  it("returns populated seeds and never retains visitor mutations", async () => {
    const first = await $fetch("/api/demo/bootstrap");
    expect(first.campaigns).toHaveLength(18);
    first.profile.name = "Edited";
    expect((await $fetch("/api/demo/bootstrap")).profile.name).toBe("Alex Morgan");
  });
  it("accepts browser-created campaigns and returns canonical validated input", async () => {
    const record = { ...seed.campaigns[0]!, id: "browser-created", name: "  Local launch  " };
    const result = await $fetch("/api/demo/campaigns/save", {
      method: "POST",
      body: { record, context },
    });
    expect(result.id).toBe("browser-created");
    expect(result.name).toBe("Local launch");
    const second = await $fetch("/api/demo/bootstrap");
    expect(second.campaigns.some((c) => c.id === result.id)).toBe(false);
    const lead = await $fetch("/api/demo/leads/save", {
      method: "POST",
      body: {
        record: { ...seed.leads[0]!, campaignId: result.id },
        context: { ...context, campaignIds: [...context.campaignIds, result.id] },
      },
    });
    expect(lead.campaignId).toBe(result.id);
  });
  it("rejects malformed dates, missing data, and unknown relationships with 400", async () => {
    for (const record of [
      { ...seed.campaigns[0]!, ownerId: "unknown" },
      { ...seed.campaigns[0]!, startDate: "2026-13-01" },
      { ...seed.campaigns[0]!, name: "" },
    ]) {
      await expect(
        $fetch("/api/demo/campaigns/save", { method: "POST", body: { record, context } })
      ).rejects.toMatchObject({ statusCode: 400 });
    }
    await expect(
      $fetch("/api/demo/documents/save", {
        method: "POST",
        body: { record: { ...seed.documents[0]!, campaignId: "missing" }, context },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("saves documents/settings, returns scripted tickets, and sends fictional chat responses", async () => {
    expect(
      (
        await $fetch("/api/demo/documents/save", {
          method: "POST",
          body: { record: seed.documents[0], context },
        })
      ).title
    ).toBe(seed.documents[0]!.title);
    expect(
      (
        await $fetch("/api/demo/settings/save", {
          method: "POST",
          body: { record: { profile: seed.profile, preferences: seed.preferences }, context },
        })
      ).profile.id
    ).toBe(seed.profile.id);
    const ticket = await $fetch("/api/demo/tickets/save", {
      method: "POST",
      body: { record: seed.tickets[0], context },
    });
    expect(ticket.response).toContain("simulated");
    const chat = await $fetch("/api/demo/chat/message", {
      method: "POST",
      body: {
        threadId: "thread-1",
        memberId: "member-1",
        replyMemberId: "member-2",
        content: "Ready for review",
        context,
      },
    });
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0]!.simulated).toBe(false);
    expect(chat.messages[1]!.simulated).toBe(true);
  });
  it("validates demo auth without returning passwords", async () => {
    const account = await $fetch("/api/demo/auth/signup", {
      method: "POST",
      body: { name: "Demo Person", email: "demo@example.com", password: "fictional123" },
    });
    expect(account.profile?.name).toBe("Demo Person");
    expect(JSON.stringify(account)).not.toContain("fictional123");
    const recovery = await $fetch("/api/demo/auth/forgot-password", {
      method: "POST",
      body: { email: "demo@example.com" },
    });
    expect(recovery.resetLink).toBe("/reset-password?token=launchpad-demo-reset");
    await expect(
      $fetch("/api/demo/auth/reset-password", {
        method: "POST",
        body: { token: "invalid", password: "fictional123" },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      $fetch("/api/demo/auth/unknown", { method: "POST", body: {} })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
