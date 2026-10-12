import { fileURLToPath } from "node:url";

import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

import { defaultPreferences } from "../../shared/types";
await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  browser: false,
  dev: true,
  nuxtConfig: { devtools: { enabled: false } },
});
describe("Nitro demo API", () => {
  it("returns a reproducible bootstrap without server-held mutations", async () => {
    const first = await $fetch("/api/demo/bootstrap");
    first.profile.name = "Edited";
    const second = await $fetch("/api/demo/bootstrap");
    expect(second.profile.name).toBe("Alex Morgan");
    expect(second.conversations.length).toBe(12);
    expect(second.models).toHaveLength(3);
  });
  it("returns typed replies and rejects invalid input with 400", async () => {
    const result = await $fetch("/api/demo/chat", {
      method: "POST",
      body: { prompt: "Review Vue code", workspaceId: "studio", preferences: defaultPreferences },
    });
    expect(result.message.role).toBe("assistant");
    expect(result.usage.source).toBe("chat");
    await expect(
      $fetch("/api/demo/chat", { method: "POST", body: { prompt: "" } })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("simulates authentication and reset without returning passwords", async () => {
    const result = await $fetch("/api/demo/auth/signup", {
      method: "POST",
      body: { name: "Demo Person", email: "demo@example.com", password: "fictional123" },
    });
    expect(result.profile.name).toBe("Demo Person");
    expect(JSON.stringify(result)).not.toContain("fictional123");
    const recovery = await $fetch("/api/demo/auth/forgot-password", {
      method: "POST",
      body: { email: "demo@example.com" },
    });
    expect(recovery.resetLink).toBe("/reset-password?token=orbit-demo-reset");
    await expect(
      $fetch("/api/demo/auth/reset-password", {
        method: "POST",
        body: { token: "bad", password: "fictional123" },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("processes audio metadata and realtime turns", async () => {
    const transcript = await $fetch("/api/demo/audio/transcribe", {
      method: "POST",
      body: { workspaceId: "studio", name: "Local note", duration: 5, mimeType: "audio/webm" },
    });
    expect(transcript.simulated).toBe(true);
    expect(transcript.segments.length).toBe(3);
    const session = await $fetch("/api/demo/realtime/session", {
      method: "POST",
      body: { workspaceId: "studio", name: "Test session" },
    });
    expect(session.messages).toEqual([]);
    const reply = await $fetch("/api/demo/realtime/turn", {
      method: "POST",
      body: { workspaceId: "studio", prompt: "An idea", preferences: defaultPreferences },
    });
    expect(reply.usage.source).toBe("realtime");
  });
});
