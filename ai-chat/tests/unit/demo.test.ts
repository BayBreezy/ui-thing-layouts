import { describe, expect, it } from "vitest";

import { restoreSnapshot } from "../../app/utils/persistence";
import { createDemoState, createReply } from "../../server/utils/fixtures";
import { assistantSchema, chatSchema, loginSchema, resetSchema } from "../../shared/schemas";
import { defaultPreferences } from "../../shared/types";
describe("deterministic demo and validated local storage", () => {
  it("seeds repeatable records with a fixed reference date", () => {
    expect(createDemoState()).toEqual(createDemoState());
  });
  it("restores edits and rejects malformed or incompatible snapshots", () => {
    const state = createDemoState();
    state.conversations[0]!.title = "My local edit";
    expect(restoreSnapshot(JSON.stringify(state))!.conversations[0]!.title).toBe("My local edit");
    expect(() => restoreSnapshot("{")).toThrow();
    expect(() => restoreSnapshot(JSON.stringify({ ...state, version: 2 }))).toThrow();
    expect(() =>
      restoreSnapshot(JSON.stringify({ ...state, activeWorkspaceId: "missing" }))
    ).toThrow();
  });
  it("rejects empty prompts, invalid model ranges, short passwords and invalid recovery tokens", async () => {
    await expect(
      chatSchema.validate({ prompt: " ", workspaceId: "studio", preferences: defaultPreferences })
    ).rejects.toThrow();
    await expect(
      chatSchema.validate({
        prompt: "hello",
        workspaceId: "studio",
        preferences: { ...defaultPreferences, temperature: 99 },
      })
    ).rejects.toThrow();
    await expect(loginSchema.validate({ email: "bad", password: "short" })).rejects.toThrow();
    await expect(
      resetSchema.validate({ token: "real-token", password: "fictional123" })
    ).rejects.toThrow();
  });
  it("validates meaningful assistants and reflects model, style, format and token limits", async () => {
    await expect(
      assistantSchema.validate({ ...createDemoState().assistants[0], instructions: "tiny" })
    ).rejects.toThrow();
    const reply = createReply("Help with onboarding", defaultPreferences, "studio");
    expect(reply.message.content).toContain("first five minutes");
    expect(
      createReply("hello", { ...defaultPreferences, modelId: "orbit-code" }, "studio").message
        .content
    ).toContain("typescript");
    expect(
      createReply("hello", { ...defaultPreferences, writingStyle: "technical" }, "studio").message
        .content
    ).toContain("Acceptance criteria");
    expect(
      createReply("hello", { ...defaultPreferences, format: "json" }, "studio").message.content
    ).toContain('"model": "orbit-pro"');
    expect(
      createReply("hello", { ...defaultPreferences, maxTokens: 128 }, "studio").message.content
        .length
    ).toBeLessThanOrEqual(512);
  });
});
