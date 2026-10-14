import { emptyFilters } from "./analytics";
import { referenceDate, widgetIds } from "./types";
import type { DemoState, Preferences } from "./types";

export function defaultPreferences(siteId: string, funnel: string[]): Preferences {
  return {
    appearance: "system",
    siteId,
    range: { preset: "30d", from: "", to: "" },
    compare: true,
    segment: "all",
    filters: emptyFilters(),
    metric: "sessions",
    widgets: widgetIds.map((id) => ({ id, visible: true })),
    funnel,
    notify: true,
    weeklyDigest: true,
    retentionMonths: 14,
  };
}

function duplicates(ids: string[]) {
  return ids.length !== new Set(ids).size;
}

/** Throws when a snapshot refers to records that do not exist. Stored data can't be trusted blindly. */
export function assertRelationships(state: DemoState) {
  const siteIds = state.sites.map((site) => site.id);
  const goalIds = state.goals.map((goal) => goal.id);
  if (duplicates(siteIds)) throw new Error("Duplicate site ids");
  if (duplicates(goalIds)) throw new Error("Duplicate goal ids");
  if (duplicates(state.reports.map((report) => report.id))) throw new Error("Duplicate report ids");
  if (duplicates(state.annotations.map((item) => item.id)))
    throw new Error("Duplicate annotation ids");
  if (duplicates(state.notifications.map((item) => item.id)))
    throw new Error("Duplicate notification ids");
  const known = new Set(siteIds);
  if (!known.has(state.preferences.siteId)) throw new Error("Unknown active site");
  for (const goal of state.goals)
    if (!known.has(goal.siteId)) throw new Error("Goal for unknown site");
  for (const report of state.reports)
    if (!known.has(report.siteId)) throw new Error("Report for unknown site");
  for (const item of state.annotations)
    if (!known.has(item.siteId)) throw new Error("Note for unknown site");
  for (const id of state.preferences.funnel)
    if (!goalIds.includes(id)) throw new Error("Funnel step for unknown goal");
  const widgets = state.preferences.widgets.map((widget) => widget.id);
  if (duplicates(widgets) || widgets.length !== widgetIds.length)
    throw new Error("Invalid widgets");
}

export const demoClock = `${referenceDate}T14:20:00`;
