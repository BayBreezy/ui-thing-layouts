/**
 * A table's search, sort and page live in the URL so a view can be bookmarked and the back button
 * works. The route is the single source of truth; report parameters pass through untouched.
 */
export function useTableQuery(
  sortKeys: readonly string[],
  defaultSort: { key: string; desc: boolean }
) {
  const route = useRoute();
  const router = useRouter();
  const text = (key: string) => {
    const value = route.query[key];
    return typeof value === "string" ? value : "";
  };
  const q = computed(() => text("q"));
  const sort = computed(() => {
    const raw = text("sort");
    const desc = raw.startsWith("-");
    const key = desc ? raw.slice(1) : raw;
    return sortKeys.includes(key) ? { key, desc } : defaultSort;
  });
  const page = computed(() => Math.max(1, Number.parseInt(text("page"), 10) || 1));

  function update(changes: Record<string, string | number | undefined>) {
    const next: Record<string, unknown> = { ...route.query };
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "" || (value === 1 && key === "page")) delete next[key];
      else next[key] = String(value);
    }
    if (!("page" in changes)) delete next.page;
    void router.replace({ path: route.path, query: next as Record<string, string> });
  }
  function toggleSort(key: string) {
    const current = sort.value;
    const desc = current.key === key ? !current.desc : true;
    update({ sort: `${desc ? "-" : ""}${key}` });
  }
  const sortLabel = (key: string) =>
    sort.value.key !== key ? "none" : sort.value.desc ? "descending" : "ascending";
  return { q, sort, page, update, toggleSort, sortLabel };
}
