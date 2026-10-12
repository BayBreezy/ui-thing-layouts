import { beforeEach, describe, expect, it } from "vitest";
import { nextTick, watch } from "vue";

import { useDemo } from "../../app/composables/useDemo";
import { createDemoState } from "../../server/utils/fixtures";
describe("workspace state", () => {
  beforeEach(() => {
    useDemo().state.value = createDemoState();
  });
  it("keeps conversation mutations reactive and scoped to the active workspace", async () => {
    const demo = useDemo();
    const conversation = demo.newConversation();
    let content = "";
    const stop = watch(
      () => demo.state.value?.conversations[0]?.title,
      (value) => {
        content = value ?? "";
      }
    );
    conversation.title = "A reactive conversation";
    await nextTick();
    expect(content).toBe("A reactive conversation");
    expect(demo.conversations.value.some((item) => item.id === conversation.id)).toBe(true);
    demo.state.value!.activeWorkspaceId = "personal";
    expect(demo.conversations.value.some((item) => item.id === conversation.id)).toBe(false);
    stop();
  });
  it("removes a conversation without touching other workspace records", () => {
    const demo = useDemo();
    const original = demo.state.value!.conversations.length;
    demo.deleteConversation("conversation-1");
    expect(demo.state.value!.conversations.length).toBe(original - 1);
    expect(demo.state.value!.conversations.some((item) => item.id === "conversation-7")).toBe(true);
  });
});
