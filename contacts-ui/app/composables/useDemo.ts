import type { NuxtApp } from "#app";
import { displayName } from "#shared/contacts";
import type {
  BulkAction,
  Contact,
  DemoState,
  FollowUp,
  Group,
  ImportResult,
  ImportRow,
  Interaction,
  MergeResult,
  SettingsRecord,
} from "#shared/types";
import { now } from "~/utils/demo";
import { storageKey } from "~/utils/persistence";
const controllers = new WeakMap<NuxtApp, Set<AbortController>>();

export function useDemo() {
  const app = useNuxtApp();
  const state = useState<DemoState | null>("verdant-demo", () => null);
  const ready = useState("verdant-ready", () => false);
  const revision = useState("verdant-revision", () => 0);
  const storageWarning = useState("verdant-storage-warning", () => "");
  const context = computed(() => ({
    groupIds: state.value?.groups.map((item) => item.id) ?? [],
    contactIds: state.value?.contacts.map((item) => item.id) ?? [],
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
  function current() {
    if (!state.value) throw new Error("Workspace is unavailable");
    return state.value;
  }
  function activity(title: string, href: string, contactId = "") {
    if (!state.value) return;
    const id = crypto.randomUUID();
    state.value.activity.unshift({ id, title, href, contactId, createdAt: now() });
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
  const nameOf = (contact: Contact) =>
    displayName(contact, state.value?.preferences.nameOrder ?? "first-last");
  /** Recomputes the "last contacted" stamp from the logged interactions. */
  function refreshLastContacted(contactId: string) {
    const draft = state.value;
    const contact = draft?.contacts.find((item) => item.id === contactId);
    if (!draft || !contact) return;
    contact.lastContactedAt =
      draft.interactions
        .filter((item) => item.contactId === contactId)
        .map((item) => item.occurredAt)
        .sort()
        .at(-1) ?? "";
  }
  /** Removes contacts and everything that points at them. */
  function purgeContacts(ids: string[]) {
    const draft = current();
    const set = new Set(ids);
    const removedHrefs = new Set(ids.map((id) => "/contacts/" + id));
    draft.contacts = draft.contacts.filter((item) => !set.has(item.id));
    draft.contacts.forEach((item) => {
      if (set.has(item.referredById)) item.referredById = "";
    });
    draft.interactions = draft.interactions.filter((item) => !set.has(item.contactId));
    draft.followUps = draft.followUps.filter((item) => !set.has(item.contactId));
    draft.activity = draft.activity.filter((item) => !set.has(item.contactId));
    draft.notifications = draft.notifications.filter((item) => !removedHrefs.has(item.href));
  }

  async function saveContact(record: Contact) {
    const saved = await request<Contact>("/api/demo/contacts/save", {
      record: { ...record, updatedAt: now() },
      context: context.value,
    });
    const draft = current();
    const previous = draft.contacts.find((item) => item.id === saved.id);
    const action = !previous
      ? "added"
      : saved.archived !== previous.archived
        ? saved.archived
          ? "archived"
          : "restored"
        : "updated";
    upsert(draft.contacts, saved);
    activity(nameOf(saved) + " was " + action, "/contacts/" + saved.id, saved.id);
    return saved;
  }
  async function toggleFavorite(contact: Contact) {
    return saveContact({ ...contact, favorite: !contact.favorite });
  }
  async function bulk(action: BulkAction, ids: string[], value = "") {
    const result = await request<{ ids: string[]; value: string; count: number }>(
      "/api/demo/contacts/bulk",
      { action, ids, value, context: context.value }
    );
    const draft = current();
    if (action === "delete") purgeContacts(result.ids);
    else {
      const set = new Set(result.ids);
      const stamp = now();
      for (const contact of draft.contacts) {
        if (!set.has(contact.id)) continue;
        if (action === "favorite") contact.favorite = true;
        if (action === "unfavorite") contact.favorite = false;
        if (action === "archive") contact.archived = true;
        if (action === "restore") contact.archived = false;
        if (action === "add-group" && !contact.groupIds.includes(result.value))
          contact.groupIds.push(result.value);
        if (action === "remove-group")
          contact.groupIds = contact.groupIds.filter((id) => id !== result.value);
        if (action === "add-label" && !contact.labels.includes(result.value))
          contact.labels.push(result.value);
        if (action === "remove-label")
          contact.labels = contact.labels.filter((label) => label !== result.value);
        contact.updatedAt = stamp;
      }
    }
    const noun = result.count === 1 ? "contact" : "contacts";
    const verbs: Record<BulkAction, string> = {
      favorite: "added to favorites",
      unfavorite: "removed from favorites",
      archive: "archived",
      restore: "restored",
      delete: "permanently deleted",
      "add-group": "added to a group",
      "remove-group": "removed from a group",
      "add-label": "labeled",
      "remove-label": "unlabeled",
    };
    activity(`${result.count} ${noun} ${verbs[action]}`, "/contacts");
    return result;
  }

  async function saveGroup(record: Group) {
    const saved = await request<Group>("/api/demo/groups/save", { record });
    const draft = current();
    const existed = draft.groups.some((item) => item.id === saved.id);
    upsert(draft.groups, saved);
    activity(`Group ${saved.name} was ${existed ? "updated" : "created"}`, "/groups/" + saved.id);
    return saved;
  }
  async function deleteGroup(id: string) {
    await request("/api/demo/records/delete", { kind: "group", id });
    const draft = current();
    const group = draft.groups.find((item) => item.id === id);
    draft.groups = draft.groups.filter((item) => item.id !== id);
    draft.contacts.forEach((contact) => {
      contact.groupIds = contact.groupIds.filter((value) => value !== id);
    });
    activity(`Group ${group?.name ?? ""} was deleted`, "/groups");
  }

  async function logInteraction(record: Interaction) {
    const saved = await request<Interaction>("/api/demo/interactions/save", {
      record,
      context: context.value,
    });
    const draft = current();
    upsert(draft.interactions, saved);
    refreshLastContacted(saved.contactId);
    const contact = draft.contacts.find((item) => item.id === saved.contactId);
    if (contact)
      activity(
        `Logged a ${saved.type} with ${nameOf(contact)}`,
        "/contacts/" + contact.id,
        contact.id
      );
    return saved;
  }
  async function deleteInteraction(id: string) {
    await request("/api/demo/records/delete", { kind: "interaction", id });
    const draft = current();
    const item = draft.interactions.find((entry) => entry.id === id);
    draft.interactions = draft.interactions.filter((entry) => entry.id !== id);
    if (item) refreshLastContacted(item.contactId);
  }

  async function saveFollowUp(record: FollowUp) {
    const saved = await request<FollowUp>("/api/demo/follow-ups/save", {
      record,
      context: context.value,
    });
    const draft = current();
    const existed = draft.followUps.some((item) => item.id === saved.id);
    upsert(draft.followUps, saved);
    const contact = draft.contacts.find((item) => item.id === saved.contactId);
    if (!existed && contact)
      activity(`Follow-up set for ${nameOf(contact)}`, "/follow-ups", contact.id);
    return saved;
  }
  async function deleteFollowUp(id: string) {
    await request("/api/demo/records/delete", { kind: "follow-up", id });
    const draft = current();
    draft.followUps = draft.followUps.filter((item) => item.id !== id);
  }

  async function previewImport(csv: string) {
    const draft = current();
    return request<ImportResult>("/api/demo/contacts/import", {
      csv,
      context: {
        groups: draft.groups.map((item) => ({ id: item.id, name: item.name })),
        emails: draft.contacts.flatMap((item) => item.emails.map((email) => email.value)),
      },
    });
  }
  /** Adds already-validated preview rows; the server has checked each of them. */
  function commitImport(rows: ImportRow[]) {
    const draft = current();
    const known = new Set(draft.contacts.map((item) => item.id));
    const added = rows.map((row) => row.contact).filter((contact) => !known.has(contact.id));
    draft.contacts.unshift(...added);
    if (added.length)
      activity(
        `Imported ${added.length} ${added.length === 1 ? "contact" : "contacts"}`,
        "/contacts"
      );
    return added;
  }

  async function merge(primary: Contact, secondary: Contact) {
    const result = await request<MergeResult>("/api/demo/contacts/merge", { primary, secondary });
    const draft = current();
    upsert(draft.contacts, result.merged);
    draft.interactions.forEach((item) => {
      if (item.contactId === result.removedId) item.contactId = result.merged.id;
    });
    draft.followUps.forEach((item) => {
      if (item.contactId === result.removedId) item.contactId = result.merged.id;
    });
    draft.contacts.forEach((item) => {
      if (item.referredById === result.removedId)
        item.referredById = item.id === result.merged.id ? "" : result.merged.id;
    });
    draft.contacts = draft.contacts.filter((item) => item.id !== result.removedId);
    draft.activity.forEach((item) => {
      if (item.contactId === result.removedId) item.contactId = result.merged.id;
    });
    draft.notifications.forEach((item) => {
      if (item.href === "/contacts/" + result.removedId)
        item.href = "/contacts/" + result.merged.id;
    });
    refreshLastContacted(result.merged.id);
    activity(
      `Merged duplicates into ${nameOf(result.merged)}`,
      "/contacts/" + result.merged.id,
      result.merged.id
    );
    return result.merged;
  }

  async function saveSettings(record: SettingsRecord) {
    const saved = await request<SettingsRecord>("/api/demo/settings/save", { record });
    const draft = current();
    draft.profile = saved.profile;
    draft.preferences = saved.preferences;
    activity("Workspace preferences updated", "/settings");
    return saved;
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
    nameOf,
    saveContact,
    toggleFavorite,
    bulk,
    saveGroup,
    deleteGroup,
    logInteraction,
    deleteInteraction,
    saveFollowUp,
    deleteFollowUp,
    previewImport,
    commitImport,
    merge,
    saveSettings,
    resetDemo,
  };
}
