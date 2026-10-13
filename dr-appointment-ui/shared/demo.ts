import type { DemoState } from "./types";

/** Throws if any record points at something that does not exist. Used on restored snapshots. */
export function assertRelationships(state: DemoState) {
  for (const list of [
    state.providers,
    state.visitTypes,
    state.patients,
    state.appointments,
    state.waitlist,
    state.activity,
    state.notifications,
  ]) {
    if (new Set(list.map((item) => item.id)).size !== list.length)
      throw new Error("Duplicate record ID");
  }
  const providers = new Set(state.providers.map((item) => item.id));
  const visits = new Set(state.visitTypes.map((item) => item.id));
  const patients = new Set(state.patients.map((item) => item.id));
  if (
    state.providers.some((item) => item.visitTypeIds.some((id) => !visits.has(id))) ||
    state.patients.some(
      (item) => item.preferredProviderId && !providers.has(item.preferredProviderId)
    )
  )
    throw new Error("Unknown provider relationship");
  if (
    state.appointments.some(
      (item) =>
        !patients.has(item.patientId) ||
        !providers.has(item.providerId) ||
        !visits.has(item.visitTypeId)
    ) ||
    state.waitlist.some(
      (item) =>
        !patients.has(item.patientId) ||
        !visits.has(item.visitTypeId) ||
        (item.providerId && !providers.has(item.providerId))
    )
  )
    throw new Error("Unknown appointment reference");
}
