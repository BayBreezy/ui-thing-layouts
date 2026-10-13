import type { DemoState } from "./types";

export function assertRelationships(state: DemoState) {
  const contacts = new Set(state.contacts.map((item) => item.id));
  const groups = new Set(state.groups.map((item) => item.id));
  for (const list of [
    state.contacts,
    state.groups,
    state.interactions,
    state.followUps,
    state.activity,
    state.notifications,
  ]) {
    if (new Set(list.map((item) => item.id)).size !== list.length)
      throw new Error("Duplicate record ID");
  }
  if (
    state.contacts.some(
      (item) =>
        item.groupIds.some((id) => !groups.has(id)) ||
        (item.referredById && (!contacts.has(item.referredById) || item.referredById === item.id))
    )
  )
    throw new Error("Unknown contact relationship");
  if (
    state.interactions.some((item) => !contacts.has(item.contactId)) ||
    state.followUps.some((item) => !contacts.has(item.contactId))
  )
    throw new Error("Unknown contact reference");
  if (state.activity.some((item) => item.contactId && !contacts.has(item.contactId)))
    throw new Error("Unknown activity relationship");
}
