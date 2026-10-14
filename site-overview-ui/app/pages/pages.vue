<script setup lang="ts">
  import { pagesCsv } from "#shared/csv";
  import { formatDuration, formatNumber, formatPercent } from "#shared/format";
  import type { PageRow } from "#shared/types";
  import { downloadFile } from "~/utils/demo";

  usePageSeo({ title: "Pages" });
  const { site } = useDemo();
  const { current, pending, error } = useReport();
  const { setFilter } = useReportQuery();
  const sortKeys = [
    "title",
    "views",
    "visitors",
    "entrances",
    "bounceRate",
    "avgDuration",
  ] as const;
  const query = useTableQuery(sortKeys, { key: "views", desc: true });
  const uid = useId();
  const search = ref(query.q.value);
  const size = 10;
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(search, (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => query.update({ q: value.trim() }), 250);
  });
  watch(query.q, (value) => {
    if (value !== search.value.trim()) search.value = value;
  });

  const filtered = computed<PageRow[]>(() => {
    const words = query.q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const rows = (current.value?.pages ?? []).filter((row) =>
      words.every((word) => `${row.title} ${row.path}`.toLowerCase().includes(word))
    );
    const { key, desc } = query.sort.value;
    return [...rows].sort((a, b) => {
      const left = key === "title" ? a.title : (a[key as keyof PageRow] as number);
      const right = key === "title" ? b.title : (b[key as keyof PageRow] as number);
      const order =
        typeof left === "string"
          ? left.localeCompare(String(right))
          : (left as number) - (right as number);
      return (desc ? -order : order) || a.path.localeCompare(b.path);
    });
  });
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / size)));
  const page = computed(() => Math.min(query.page.value, pageCount.value));
  const rows = computed(() => filtered.value.slice((page.value - 1) * size, page.value * size));

  const open = ref(false);
  const detail = ref<PageRow | null>(null);
  function show(row: PageRow) {
    detail.value = row;
    open.value = true;
  }
  async function filterTo(row: PageRow) {
    setFilter("page", row.path);
    open.value = false;
    await navigateTo("/");
  }
  function exportCsv() {
    downloadFile(`${site.value?.id ?? "beacon"}-pages.csv`, pagesCsv(filtered.value));
    useSonner.success("Pages exported", { description: `${filtered.value.length} pages as CSV.` });
  }
  const columns = [
    { key: "title", label: "Page", numeric: false },
    { key: "views", label: "Pageviews", numeric: true },
    { key: "visitors", label: "Visitors", numeric: true },
    { key: "entrances", label: "Entrances", numeric: true },
    { key: "bounceRate", label: "Bounce rate", numeric: true },
    { key: "avgDuration", label: "Avg. time", numeric: true },
  ] as const;
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Pages"
      description="Every page that received traffic in this range, with how visitors behaved on it."
    >
      <UiButton variant="outline" :disabled="!filtered.length" @click="exportCsv">
        <Icon name="lucide:download" />Export CSV
      </UiButton>
    </BeaconPageHeader>
    <BeaconFilterBar />
    <BeaconError :message="error" class="mb-4" />

    <form class="mb-4 max-w-sm space-y-1.5" role="search" @submit.prevent>
      <UiLabel :for="`${uid}-q`">Search pages</UiLabel>
      <div class="relative">
        <Icon
          name="lucide:search"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <UiInput
          :id="`${uid}-q`"
          v-model="search"
          type="search"
          class="pl-9"
          placeholder="Title or path"
        />
      </div>
    </form>

    <div v-if="!current" class="space-y-2">
      <UiSkeleton v-for="n in 6" :key="n" class="h-12" />
    </div>
    <div v-else-if="rows.length" class="overflow-x-auto rounded-lg border" :aria-busy="pending">
      <UiTable>
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead
              v-for="column in columns"
              :key="column.key"
              :aria-sort="query.sortLabel(column.key)"
              :class="column.numeric && 'text-right'"
            >
              <button
                type="button"
                :class="[
                  'inline-flex items-center gap-1 font-medium',
                  column.numeric && 'flex-row-reverse',
                ]"
                @click="query.toggleSort(column.key)"
              >
                {{ column.label }}
                <Icon
                  :name="
                    query.sortLabel(column.key) === 'none'
                      ? 'lucide:arrow-up-down'
                      : query.sortLabel(column.key) === 'ascending'
                        ? 'lucide:arrow-up'
                        : 'lucide:arrow-down'
                  "
                  class="size-3.5 opacity-60"
                />
              </button>
            </UiTableHead>
            <UiTableHead class="text-right">Change</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="row in rows" :key="row.path">
            <UiTableCell>
              <button
                type="button"
                class="text-left font-medium hover:underline focus-visible:underline"
                @click="show(row)"
              >
                {{ row.title }}
              </button>
              <p class="font-mono text-xs text-muted-foreground">{{ row.path }}</p>
            </UiTableCell>
            <UiTableCell class="text-right tabular-nums">{{ formatNumber(row.views) }}</UiTableCell>
            <UiTableCell class="text-right tabular-nums">{{
              formatNumber(row.visitors)
            }}</UiTableCell>
            <UiTableCell class="text-right tabular-nums">{{
              formatNumber(row.entrances)
            }}</UiTableCell>
            <UiTableCell class="text-right tabular-nums">{{
              formatPercent(row.bounceRate)
            }}</UiTableCell>
            <UiTableCell class="text-right tabular-nums">{{
              formatDuration(row.avgDuration)
            }}</UiTableCell>
            <UiTableCell class="text-right">
              <BeaconDelta v-if="row.change !== null" :change="row.change" />
              <span v-else class="text-xs text-muted-foreground">—</span>
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
    <BeaconEmpty
      v-else
      title="No pages match"
      description="Try a different search, a wider date range or fewer filters."
      icon="lucide:file-search"
    >
      <UiButton variant="outline" @click="query.update({ q: '' })">Clear search</UiButton>
    </BeaconEmpty>

    <nav
      v-if="pageCount > 1"
      class="mt-4 flex items-center justify-between"
      aria-label="Pagination"
    >
      <p class="text-sm text-muted-foreground">Page {{ page }} of {{ pageCount }}</p>
      <div class="flex gap-2">
        <UiButton
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          @click="query.update({ page: page - 1 })"
        >
          <Icon name="lucide:chevron-left" />Previous
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="page >= pageCount"
          @click="query.update({ page: page + 1 })"
        >
          Next<Icon name="lucide:chevron-right" />
        </UiButton>
      </div>
    </nav>

    <UiSheet v-model:open="open">
      <UiSheetContent side="right" class="sm:max-w-md">
        <template v-if="detail">
          <UiSheetHeader>
            <UiSheetTitle>{{ detail.title }}</UiSheetTitle>
            <UiSheetDescription class="font-mono">{{ detail.path }}</UiSheetDescription>
          </UiSheetHeader>
          <dl class="grid grid-cols-2 gap-4 px-4">
            <div>
              <dt class="text-sm text-muted-foreground">Pageviews</dt>
              <dd class="text-2xl font-semibold tabular-nums">{{ formatNumber(detail.views) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Visitors</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ formatNumber(detail.visitors) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Entrances</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ formatNumber(detail.entrances) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Bounce rate</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ formatPercent(detail.bounceRate) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Avg. time on site</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ formatDuration(detail.avgDuration) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">Vs previous period</dt>
              <dd class="text-2xl font-semibold">
                <BeaconDelta v-if="detail.change !== null" :change="detail.change" />
                <span v-else class="text-base text-muted-foreground">Not available</span>
              </dd>
            </div>
          </dl>
          <UiSheetFooter>
            <UiButton @click="filterTo(detail)">
              <Icon name="lucide:list-filter" />See the overview for this page
            </UiButton>
          </UiSheetFooter>
        </template>
      </UiSheetContent>
    </UiSheet>
  </div>
</template>
