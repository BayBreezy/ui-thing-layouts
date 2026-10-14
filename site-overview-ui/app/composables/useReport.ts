import type { ReportResult } from "#shared/types";

/**
 * The current report. The layout runs `useReportLoader()` once; pages just read the shared result
 * so moving between routes never flashes an empty state.
 */
export function useReport() {
  const report = useState<ReportResult | null>("beacon-report", () => null);
  const pending = useState("beacon-report-pending", () => false);
  const error = useState("beacon-report-error", () => "");
  const key = useState("beacon-report-key", () => "");
  const tick = useState("beacon-report-tick", () => 0);
  const { site } = useDemo();
  /** The report, but only once it belongs to the site being shown. */
  const current = computed(() =>
    report.value && report.value.query.siteId === site.value?.id ? report.value : null
  );
  const refresh = () => {
    tick.value++;
  };
  return { report, current, pending, error, key, tick, refresh };
}

export function useReportLoader() {
  const { state, ready, request, site, siteGoals } = useDemo();
  const { query } = useReportQuery();
  const { report, pending, error, key, tick } = useReport();
  let sequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const payload = computed(() => {
    const q = query.value;
    const s = site.value;
    if (!ready.value || !q || !s || !state.value) return null;
    return {
      query: q,
      site: { id: s.id, pages: s.pages },
      goals: siteGoals.value,
      funnel: state.value.preferences.funnel,
    };
  });

  async function load(force = false) {
    const body = payload.value;
    if (!body) return;
    const next = JSON.stringify(body);
    if (!force && next === key.value && report.value) return;
    const mine = ++sequence;
    pending.value = true;
    error.value = "";
    try {
      const result = await request<ReportResult>("/api/demo/report", body);
      if (mine !== sequence) return;
      report.value = result;
      key.value = next;
    } catch (cause) {
      if (mine !== sequence) return;
      const failure = cause as { data?: { statusMessage?: string } };
      error.value =
        failure.data?.statusMessage ||
        "We couldn't load this report. Check your connection and retry.";
    } finally {
      if (mine === sequence) pending.value = false;
    }
  }

  if (import.meta.client) {
    watch(
      payload,
      () => {
        clearTimeout(timer);
        timer = setTimeout(() => void load(), 60);
      },
      { immediate: true, deep: true }
    );
    watch(tick, () => void load(true));
    onBeforeUnmount(() => clearTimeout(timer));
  }
  return { load };
}
