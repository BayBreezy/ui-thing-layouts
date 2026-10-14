import { emptyFilters } from "#shared/analytics";
import { isDate, resolveRange } from "#shared/dates";
import { typed } from "#shared/schemas";
import type { Filters, Preferences, RangePreset, ReportQuery, Segment } from "#shared/types";

/** Query-string keys that carry the report question. Anything else belongs to the page. */
const keys = [
  "site",
  "range",
  "from",
  "to",
  "compare",
  "segment",
  "channel",
  "device",
  "country",
  "path",
] as const;

type Params = Partial<Record<(typeof keys)[number], string>>;

/** The URL form of a set of preferences. Defaults are left out so shared links stay short. */
export function toParams(prefs: Preferences, firstSiteId: string): Params {
  const params: Params = {};
  if (prefs.siteId !== firstSiteId) params.site = prefs.siteId;
  if (prefs.range.preset !== "30d") params.range = prefs.range.preset;
  if (prefs.range.preset === "custom") {
    params.from = prefs.range.from;
    params.to = prefs.range.to;
  }
  if (!prefs.compare) params.compare = "0";
  if (prefs.segment !== "all") params.segment = prefs.segment;
  if (prefs.filters.channel) params.channel = prefs.filters.channel;
  if (prefs.filters.device) params.device = prefs.filters.device;
  if (prefs.filters.country) params.country = prefs.filters.country;
  if (prefs.filters.page) params.path = prefs.filters.page;
  return params;
}

/** Reads the report question out of a query string, ignoring anything invalid. */
export function readParams(query: Record<string, unknown>): Params {
  const params: Params = {};
  for (const key of keys) {
    const value = query[key];
    if (typeof value === "string" && value) params[key] = value;
  }
  return params;
}

export function applyParams(prefs: Preferences, params: Params, siteIds: string[]) {
  const preset = params.range;
  if (params.site && siteIds.includes(params.site)) prefs.siteId = params.site;
  if (preset === undefined) prefs.range = { preset: "30d", from: "", to: "" };
  else if (typed.preset(preset)) {
    prefs.range =
      preset === "custom" && isDate(params.from) && isDate(params.to)
        ? { preset, from: params.from, to: params.to }
        : { preset: preset === "custom" ? "30d" : (preset as RangePreset), from: "", to: "" };
  }
  prefs.compare = params.compare !== "0";
  prefs.segment = params.segment && typed.segment(params.segment) ? params.segment : "all";
  const filters: Filters = emptyFilters();
  if (params.channel && typed.channel(params.channel)) filters.channel = params.channel;
  if (params.device && typed.device(params.device)) filters.device = params.device;
  if (params.country && /^[A-Z]{2}$/.test(params.country)) filters.country = params.country;
  if (params.path?.startsWith("/")) filters.page = params.path.slice(0, 200);
  prefs.filters = filters;
}

/** The report question derived from the saved preferences, plus the setters that change it. */
export function useReportQuery() {
  const { state } = useDemo();
  const prefs = computed(() => state.value?.preferences);
  const range = computed(() => (prefs.value ? resolveRange(prefs.value.range) : null));
  const query = computed<ReportQuery | null>(() => {
    const p = prefs.value;
    const r = range.value;
    if (!p || !r) return null;
    return {
      siteId: p.siteId,
      from: r.from,
      to: r.to,
      compare: p.compare,
      segment: p.segment,
      filters: p.filters,
      interval: "auto",
    };
  });
  const activeFilters = computed(() => {
    const f = prefs.value?.filters;
    return f ? Object.entries(f).filter(([, value]) => Boolean(value)) : [];
  });
  const filtering = computed(
    () => activeFilters.value.length > 0 || (prefs.value?.segment ?? "all") !== "all"
  );

  function setPreset(preset: Exclude<RangePreset, "custom">) {
    if (prefs.value) prefs.value.range = { preset, from: "", to: "" };
  }
  function setCustomRange(from: string, to: string) {
    if (!prefs.value || !isDate(from) || !isDate(to)) return;
    const [start, end] = from <= to ? [from, to] : [to, from];
    prefs.value.range = { preset: "custom", from: start, to: end };
  }
  function setSegment(segment: Segment) {
    if (prefs.value) prefs.value.segment = segment;
  }
  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    if (prefs.value) prefs.value.filters = { ...prefs.value.filters, [key]: value };
  }
  function clearFilters() {
    if (!prefs.value) return;
    prefs.value.filters = emptyFilters();
    prefs.value.segment = "all";
  }

  return {
    prefs,
    range,
    query,
    activeFilters,
    filtering,
    setPreset,
    setCustomRange,
    setSegment,
    setFilter,
    clearFilters,
  };
}

/**
 * Keeps the address bar and the saved preferences in step. A link with report parameters wins when
 * it is opened or followed; otherwise the preferences are written back to the URL.
 */
export function useReportUrlSync() {
  const route = useRoute();
  const router = useRouter();
  const { state, ready } = useDemo();

  const serialized = () => {
    const draft = state.value;
    return draft ? toParams(draft.preferences, draft.sites[0]!.id) : {};
  };
  const same = (a: Params, b: Params) => JSON.stringify(a) === JSON.stringify(b);
  function write() {
    if (!ready.value || !state.value) return;
    const wanted = serialized();
    const rest = Object.fromEntries(
      Object.entries(route.query).filter(([key]) => !(keys as readonly string[]).includes(key))
    );
    if (same(readParams(route.query), wanted)) return;
    void router.replace({ path: route.path, query: { ...rest, ...wanted }, hash: route.hash });
  }
  function reconcile() {
    if (!ready.value || !state.value) return;
    const fromUrl = readParams(route.query);
    if (Object.keys(fromUrl).length && !same(fromUrl, serialized())) {
      applyParams(
        state.value.preferences,
        fromUrl,
        state.value.sites.map((site) => site.id)
      );
      return;
    }
    write();
  }
  watch(ready, reconcile, { immediate: true });
  watch(() => route.fullPath, reconcile);
  watch(serialized, write, { deep: true });
}
