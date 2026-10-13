import { fullName } from "#shared/patients";
import { addDays } from "#shared/schedule";
import type { Appointment } from "#shared/types";
import { appointmentStatuses } from "#shared/types";
import { today } from "~/utils/demo";

export const pageSizes = [10, 20, 50] as const;
export const sortKeys = ["when", "patient", "provider", "status"] as const;
export const ranges = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "week", label: "Next 7 days" },
  { value: "past", label: "Past" },
  { value: "all", label: "All time" },
] as const;

/**
 * The appointments list keeps its search, filters, sort and page in the URL, so a view can be
 * bookmarked, shared and restored with the back button. The route is the single source of truth.
 */
export function useAppointmentsTable() {
  const route = useRoute();
  const router = useRouter();
  const { state } = useDemo();
  const text = (key: string) =>
    computed(() => {
      const value = route.query[key];
      return typeof value === "string" ? value : "";
    });
  const q = text("q");
  const status = computed(() => {
    const value = text("status").value;
    return (appointmentStatuses as readonly string[]).includes(value) ? value : "";
  });
  const provider = text("provider");
  const visitType = text("type");
  const range = computed(() => {
    const value = text("range").value;
    return ranges.some((item) => item.value === value) ? value : "upcoming";
  });
  const sort = computed(() => {
    const raw = text("sort").value;
    const desc = raw.startsWith("-");
    const key = desc ? raw.slice(1) : raw;
    return (sortKeys as readonly string[]).includes(key)
      ? { key, desc }
      : { key: "when", desc: range.value === "past" };
  });
  const page = computed(() => Math.max(1, Number.parseInt(text("page").value, 10) || 1));
  const pageSize = computed(() => {
    const value = Number(text("size").value);
    return (pageSizes as readonly number[]).includes(value)
      ? value
      : (state.value?.preferences.pageSize ?? 20);
  });
  const filtering = computed(
    () =>
      Boolean(q.value || status.value || provider.value || visitType.value) ||
      range.value !== "upcoming"
  );

  const filtered = computed<Appointment[]>(() => {
    const draft = state.value;
    if (!draft) return [];
    const patients = new Map(draft.patients.map((item) => [item.id, fullName(item)]));
    const providers = new Map(draft.providers.map((item) => [item.id, item.name]));
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const week = addDays(today, 7);
    const list = draft.appointments.filter((item) => {
      if (status.value && item.status !== status.value) return false;
      if (provider.value && item.providerId !== provider.value) return false;
      if (visitType.value && item.visitTypeId !== visitType.value) return false;
      // "Upcoming" is what is still ahead: nothing from earlier days, and nothing finished today.
      if (
        range.value === "upcoming" &&
        (item.date < today || ["completed", "cancelled", "no-show"].includes(item.status))
      )
        return false;
      if (range.value === "today" && item.date !== today) return false;
      if (range.value === "week" && (item.date < today || item.date > week)) return false;
      if (range.value === "past" && item.date >= today) return false;
      if (words.length) {
        const haystack =
          `${patients.get(item.patientId) ?? ""} ${item.reference} ${item.reason}`.toLowerCase();
        if (!words.every((word) => haystack.includes(word))) return false;
      }
      return true;
    });
    const direction = sort.value.desc ? -1 : 1;
    const key = sort.value.key;
    return list.sort((a, b) => {
      let result = 0;
      if (key === "patient")
        result = (patients.get(a.patientId) ?? "").localeCompare(patients.get(b.patientId) ?? "");
      else if (key === "provider")
        result = (providers.get(a.providerId) ?? "").localeCompare(
          providers.get(b.providerId) ?? ""
        );
      else if (key === "status") result = a.status.localeCompare(b.status);
      if (result === 0) result = (a.date + a.start).localeCompare(b.date + b.start);
      return result * direction;
    });
  });
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
  const currentPage = computed(() => Math.min(page.value, pageCount.value));
  const rows = computed(() =>
    filtered.value.slice(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    )
  );

  /** Merges `patch` into the query, dropping empty values. Changing a filter returns to page 1. */
  function update(patch: Record<string, string | number | undefined>) {
    const next: Record<string, string | (string | null)[] | null | undefined> = { ...route.query };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") delete next[key];
      else next[key] = String(value);
    }
    if (!("page" in patch)) delete next.page;
    return router.replace({ query: next });
  }
  function toggleSort(key: (typeof sortKeys)[number]) {
    const current = sort.value;
    const desc = current.key === key ? !current.desc : false;
    return update({ sort: (desc ? "-" : "") + key });
  }
  const clearFilters = () => update({ q: "", status: "", provider: "", type: "", range: "" });
  return {
    q,
    status,
    provider,
    visitType,
    range,
    sort,
    page: currentPage,
    pageSize,
    pageCount,
    filtering,
    filtered,
    rows,
    update,
    toggleSort,
    clearFilters,
  };
}
