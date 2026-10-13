import type { ColumnFiltersState, SortingState } from "@tanstack/vue-table";

export const pageSizes = [10, 20, 50] as const;
/** Column ids a person can sort by, which keeps `?sort=` from taking arbitrary input. */
export const sortableColumns = [
  "name",
  "company",
  "relationship",
  "lastContacted",
  "createdAt",
] as const;

/**
 * The contacts list keeps its search, filters, sort and page in the URL so a view can be shared,
 * bookmarked and restored with the back button. The route is the source of truth; the TanStack
 * table state is derived from it, and table events write back to it.
 */
export function useContactsTable() {
  const route = useRoute();
  const router = useRouter();
  const { state } = useDemo();
  const text = (key: string) =>
    computed(() => {
      const value = route.query[key];
      return typeof value === "string" ? value : "";
    });
  const q = text("q");
  const group = text("group");
  const label = text("label");
  const relationship = text("rel");
  const missing = text("missing");
  const favorites = computed(() => route.query.fav === "1");
  const view = computed<"table" | "grid">(() => {
    const value = route.query.view;
    if (value === "grid" || value === "table") return value;
    return state.value?.preferences.defaultView ?? "table";
  });
  const sorting = computed<SortingState>(() => {
    const raw = text("sort").value;
    const desc = raw.startsWith("-");
    const id = desc ? raw.slice(1) : raw;
    return (sortableColumns as readonly string[]).includes(id) ? [{ id, desc }] : [];
  });
  const page = computed(() => Math.max(1, Number.parseInt(text("page").value, 10) || 1));
  const pageSize = computed(() => {
    const value = Number(text("size").value);
    return (pageSizes as readonly number[]).includes(value)
      ? value
      : (state.value?.preferences.pageSize ?? 10);
  });
  const columnFilters = computed<ColumnFiltersState>(
    () =>
      [
        group.value && { id: "groups", value: group.value },
        label.value && { id: "labels", value: label.value },
        relationship.value && { id: "relationship", value: relationship.value },
        missing.value && { id: "missing", value: missing.value },
        favorites.value && { id: "favorite", value: true },
      ].filter(Boolean) as ColumnFiltersState
  );
  const filtering = computed(() => Boolean(q.value) || columnFilters.value.length > 0);

  /** Merges `patch` into the query, dropping empty values. Changing a filter returns to page 1. */
  function update(patch: Record<string, string | number | boolean | undefined>, keepPage = false) {
    const next: Record<string, string | (string | null)[] | null | undefined> = { ...route.query };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === false) delete next[key];
      else next[key] = value === true ? "1" : String(value);
    }
    if (!keepPage && !("page" in patch)) delete next.page;
    return router.replace({ query: next });
  }
  function clearFilters() {
    return update({ q: "", group: "", label: "", rel: "", missing: "", fav: false });
  }
  return {
    q,
    group,
    label,
    relationship,
    missing,
    favorites,
    view,
    sorting,
    page,
    pageSize,
    columnFilters,
    filtering,
    update,
    clearFilters,
  };
}
