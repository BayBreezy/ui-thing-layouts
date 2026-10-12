import type { Assistant, Conversation, DemoState } from "#shared/types";

export function useDemo() {
  const state = useState<DemoState | null>("orbit-demo", () => null);
  const newChatKey = useState("orbit-new-chat-key", () => 0);
  function openNewChat() {
    newChatKey.value++;
    return navigateTo("/");
  }
  const ready = useState("orbit-ready", () => false);
  const storageWarning = useState("orbit-storage-warning", () => "");
  const workspace = computed(() =>
    state.value?.workspaces.find((item) => item.id === state.value?.activeWorkspaceId)
  );
  const conversations = computed(
    () =>
      state.value?.conversations
        .filter((item) => item.workspaceId === state.value?.activeWorkspaceId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) ?? []
  );
  const assistants = computed(
    () =>
      state.value?.assistants.filter(
        (item) => item.workspaceId === state.value?.activeWorkspaceId
      ) ?? []
  );
  function newConversation(assistant?: Assistant) {
    if (!state.value) throw new Error("Workspace is not ready");
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      workspaceId: state.value.activeWorkspaceId,
      title: "Untitled conversation",
      assistantId: assistant?.id,
      favorite: false,
      createdAt: now,
      updatedAt: now,
      messages: [],
      preferences: {
        ...state.value.preferences,
        ...(assistant ? { modelId: assistant.modelId, writingStyle: assistant.writingStyle } : {}),
      },
    };
    state.value.conversations.unshift(conversation);
    return state.value.conversations[0]!;
  }
  function switchWorkspace(id: string) {
    if (!state.value?.workspaces.some((item) => item.id === id)) return;
    state.value.activeWorkspaceId = id;
    openNewChat();
  }
  function deleteConversation(id: string) {
    if (!state.value) return;
    const removed = state.value.conversations.find((item) => item.id === id);
    state.value.conversations = state.value.conversations.filter((item) => item.id !== id);
    for (const message of removed?.messages ?? [])
      for (const attachment of message.attachments ?? [])
        if (attachment.blobId) void removeBlob(attachment.blobId).catch(() => {});
  }
  return {
    state,
    ready,
    storageWarning,
    workspace,
    conversations,
    assistants,
    newConversation,
    newChatKey,
    openNewChat,
    switchWorkspace,
    deleteConversation,
  };
}
