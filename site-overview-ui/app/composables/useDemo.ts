import type { NuxtApp } from "#app";
import type {
  Annotation,
  DemoState,
  Goal,
  Notification,
  Preferences,
  SavedReport,
  SettingsRecord,
  Site,
} from "#shared/types";
import { newId, now } from "~/utils/demo";
import { storageKey } from "~/utils/persistence";
const controllers = new WeakMap<NuxtApp, Set<AbortController>>();

export function useDemo() {
  const app = useNuxtApp();
  const state = useState<DemoState | null>("beacon-demo", () => null);
  const ready = useState("beacon-ready", () => false);
  const revision = useState("beacon-revision", () => 0);
  const storageWarning = useState("beacon-storage-warning", () => "");

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
  function current() {
    if (!state.value) throw new Error("Workspace is unavailable");
    return state.value;
  }
  const site = computed<Site | undefined>(
    () =>
      state.value?.sites.find((item) => item.id === state.value?.preferences.siteId) ??
      state.value?.sites[0]
  );
  const siteGoals = computed<Goal[]>(
    () => state.value?.goals.filter((goal) => goal.siteId === site.value?.id) ?? []
  );
  const siteContext = () => ({ siteIds: current().sites.map((item) => item.id) });

  function upsert<T extends { id: string }>(items: T[], record: T) {
    const index = items.findIndex((item) => item.id === record.id);
    if (index === -1) items.unshift(record);
    else items.splice(index, 1, record);
  }
  /** Adds an inbox note for something the visitor did, when notifications are on. */
  function notify(title: string, href: string, detail = "") {
    const draft = state.value;
    if (!draft?.preferences.notify) return;
    draft.notifications.unshift({
      id: newId("note"),
      siteId: draft.preferences.siteId,
      title,
      detail,
      href,
      tone: "info",
      read: false,
      createdAt: now(),
    });
    draft.notifications = draft.notifications.slice(0, 60);
  }

  async function saveGoal(record: Goal) {
    const saved = await request<Goal>("/api/demo/goals/save", { record, context: siteContext() });
    const existed = current().goals.some((item) => item.id === saved.id);
    upsert(current().goals, saved);
    if (!existed) notify(`Goal “${saved.name}” was added`, "/goals");
    return saved;
  }
  async function removeGoal(id: string) {
    await request("/api/demo/records/delete", { kind: "goal", id });
    const draft = current();
    draft.goals = draft.goals.filter((item) => item.id !== id);
    draft.preferences.funnel = draft.preferences.funnel.filter((item) => item !== id);
  }
  async function saveReport(record: SavedReport) {
    const saved = await request<SavedReport>("/api/demo/reports/save", {
      record,
      context: siteContext(),
    });
    upsert(current().reports, saved);
    return saved;
  }
  async function removeReport(id: string) {
    await request("/api/demo/records/delete", { kind: "report", id });
    current().reports = current().reports.filter((item) => item.id !== id);
  }
  async function saveAnnotation(record: Annotation) {
    const saved = await request<Annotation>("/api/demo/annotations/save", {
      record,
      context: siteContext(),
    });
    upsert(current().annotations, saved);
    return saved;
  }
  async function removeAnnotation(id: string) {
    await request("/api/demo/records/delete", { kind: "annotation", id });
    current().annotations = current().annotations.filter((item) => item.id !== id);
  }
  async function saveSite(record: Site) {
    const saved = await request<Site>("/api/demo/sites/save", { record });
    const draft = current();
    const existed = draft.sites.some((item) => item.id === saved.id);
    if (existed) draft.sites = draft.sites.map((item) => (item.id === saved.id ? saved : item));
    else draft.sites.push(saved);
    if (!existed) notify(`${saved.name} was added`, "/settings");
    return saved;
  }
  async function removeSite(id: string) {
    const draft = current();
    if (draft.sites.length <= 1) throw new Error("Keep at least one site in the workspace.");
    await request("/api/demo/records/delete", { kind: "site", id });
    draft.sites = draft.sites.filter((item) => item.id !== id);
    const removedGoals = draft.goals.filter((goal) => goal.siteId === id).map((goal) => goal.id);
    draft.goals = draft.goals.filter((goal) => goal.siteId !== id);
    draft.reports = draft.reports.filter((item) => item.siteId !== id);
    draft.annotations = draft.annotations.filter((item) => item.siteId !== id);
    draft.notifications = draft.notifications.filter((item) => item.siteId !== id);
    draft.preferences.funnel = draft.preferences.funnel.filter(
      (item) => !removedGoals.includes(item)
    );
    if (draft.preferences.siteId === id) draft.preferences.siteId = draft.sites[0]!.id;
  }
  async function saveSettings(record: SettingsRecord) {
    const saved = await request<SettingsRecord>("/api/demo/settings/save", { record });
    const draft = current();
    draft.profile = saved.profile;
    draft.preferences = { ...draft.preferences, ...(saved.preferences as Preferences) };
    return saved;
  }
  function markAllRead() {
    state.value?.notifications.forEach((item: Notification) => {
      item.read = true;
    });
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
    site,
    siteGoals,
    request,
    notify,
    saveGoal,
    removeGoal,
    saveReport,
    removeReport,
    saveAnnotation,
    removeAnnotation,
    saveSite,
    removeSite,
    saveSettings,
    markAllRead,
    resetDemo,
  };
}
