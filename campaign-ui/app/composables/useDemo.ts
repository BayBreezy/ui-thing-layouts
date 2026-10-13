import type { NuxtApp } from "#app";
import type {
  Brief,
  Campaign,
  DemoState,
  Lead,
  Message,
  SettingsRecord,
  Thread,
  Ticket,
} from "#shared/types";
import { storageKey } from "~/utils/persistence";
const controllers = new WeakMap<NuxtApp, Set<AbortController>>();

export function useDemo() {
  const app = useNuxtApp();
  const state = useState<DemoState | null>("launchpad-demo", () => null);
  const ready = useState("launchpad-ready", () => false);
  const revision = useState("launchpad-revision", () => 0);
  const storageWarning = useState("launchpad-storage-warning", () => "");
  const context = computed(() => ({
    memberIds: state.value?.members.map((item) => item.id) ?? [],
    campaignIds: state.value?.campaigns.map((item) => item.id) ?? [],
  }));
  async function request<T>(
    path: string,
    body?: unknown,
    method: "GET" | "POST" = "POST"
  ): Promise<T> {
    const epoch = revision.value;
    const controller = new AbortController();
    if (!controllers.has(app)) controllers.set(app, new Set());
    controllers.get(app)!.add(controller);
    try {
      const result = await $fetch<T>(path, {
        method,
        body: body as Record<string, unknown> | undefined,
        signal: controller.signal,
      });
      if (epoch !== revision.value) throw new Error("The demo was reset. Try your action again.");
      return result as T;
    } finally {
      controllers.get(app)!.delete(controller);
    }
  }
  function activity(title: string, href: string, campaignId = "") {
    if (!state.value) return;
    const id = crypto.randomUUID();
    state.value.activity.unshift({ id, title, href, campaignId, createdAt: now() });
    state.value.activity = state.value.activity.slice(0, 250);
    if (state.value.preferences.notify) {
      state.value.notifications.unshift({ id, title, href, read: false });
      state.value.notifications = state.value.notifications.slice(0, 50);
    }
  }
  function upsert<T extends { id: string }>(items: T[], record: T) {
    const index = items.findIndex((item) => item.id === record.id);
    if (index === -1) items.unshift(record);
    else items.splice(index, 1, record);
  }
  async function saveCampaign(record: Campaign) {
    const saved = await request<Campaign>("/api/demo/campaigns/save", {
      record: { ...record, updatedAt: now() },
      context: context.value,
    });
    if (!state.value) throw new Error("Workspace is unavailable");
    const previous = state.value.campaigns.find((item) => item.id === saved.id);
    const action = !previous
      ? "created"
      : saved.archived !== previous.archived
        ? saved.archived
          ? "archived"
          : "restored"
        : "updated";
    upsert(state.value.campaigns, saved);
    activity(saved.name + " was " + action, "/campaigns/" + saved.id, saved.id);
    return saved;
  }
  async function duplicateCampaign(record: Campaign) {
    const copy = clone(record);
    copy.id = crypto.randomUUID();
    copy.name += " (copy)";
    copy.status = "Draft";
    copy.archived = false;
    copy.createdAt = now();
    copy.checklist.forEach((item) => {
      item.id = crypto.randomUUID();
      item.done = false;
    });
    return saveCampaign(copy);
  }
  async function saveLead(record: Lead) {
    const saved = await request<Lead>("/api/demo/leads/save", {
      record: { ...record, updatedAt: now() },
      context: context.value,
    });
    if (!state.value) throw new Error("Workspace is unavailable");
    upsert(state.value.leads, saved);
    activity(saved.name + " was updated", "/leads/" + saved.id, saved.campaignId);
    return saved;
  }
  async function saveBrief(record: Brief) {
    const saved = await request<Brief>("/api/demo/documents/save", {
      record: { ...record, updatedAt: now() },
      context: context.value,
    });
    if (!state.value) throw new Error("Workspace is unavailable");
    upsert(state.value.documents, saved);
    activity(saved.title + " was updated", "/documents/" + saved.id, saved.campaignId);
    return saved;
  }
  async function saveTicket(record: Ticket) {
    const saved = await request<Ticket>("/api/demo/tickets/save", {
      record,
      context: context.value,
    });
    if (!state.value) throw new Error("Workspace is unavailable");
    upsert(state.value.tickets, saved);
    activity("Support ticket: " + saved.subject, "/support/tickets/" + saved.id);
    return saved;
  }
  async function saveSettings(record: SettingsRecord) {
    const saved = await request<SettingsRecord>("/api/demo/settings/save", {
      record,
      context: context.value,
    });
    if (!state.value) throw new Error("Workspace is unavailable");
    state.value.profile = saved.profile;
    state.value.preferences = saved.preferences;
    const member = state.value.members.find((item) => item.id === saved.profile.id);
    if (member) Object.assign(member, saved.profile);
    activity("Workspace preferences updated", "/settings");
    return saved;
  }
  async function sendMessage(thread: Thread, content: string) {
    const result = await request<{ threadId: string; messages: Message[] }>(
      "/api/demo/chat/message",
      {
        threadId: thread.id,
        memberId: state.value!.profile.id,
        replyMemberId: "member-2",
        content,
        context: context.value,
      }
    );
    const current = state.value?.threads.find((item) => item.id === result.threadId);
    if (!current) throw new Error("Conversation is unavailable");
    current.messages.push(...result.messages);
    current.unread = false;
    activity("New message in " + current.title, "/chat/" + current.id, current.campaignId);
  }
  function markThreadRead(id: string) {
    const thread = state.value?.threads.find((item) => item.id === id);
    if (thread) thread.unread = false;
  }
  async function resetDemo() {
    revision.value++;
    controllers.get(app)?.forEach((controller) => controller.abort());
    const fresh = await request<DemoState>("/api/demo/bootstrap", undefined, "GET");
    state.value = fresh;
    try {
      localStorage.setItem(storageKey, JSON.stringify(fresh));
      storageWarning.value = "";
    } catch {
      storageWarning.value = "Browser storage is unavailable. Changes last for this visit only.";
    }
  }
  return {
    state,
    ready,
    storageWarning,
    revision,
    context,
    request,
    saveCampaign,
    duplicateCampaign,
    saveLead,
    saveBrief,
    saveTicket,
    saveSettings,
    sendMessage,
    markThreadRead,
    resetDemo,
  };
}
