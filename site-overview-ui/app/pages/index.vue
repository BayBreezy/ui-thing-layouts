<script setup lang="ts">
  import { formatNumber, metricLabels, pctChange } from "#shared/format";
  import { liveVisitors } from "#shared/live";
  import type { Metric, PageRow, RankedRow, Segment, WidgetId } from "#shared/types";
  import { referenceHour } from "#shared/types";

  const { state, site } = useDemo();
  const { current, pending, error, refresh } = useReport();
  const { prefs, setSegment, setFilter } = useReportQuery();
  usePageSeo({ title: "Overview" });

  const customizing = ref(false);
  const stats: Metric[] = ["sessions", "visitors", "bounceRate", "avgDuration"];
  const segmentTabs: { value: Segment; label: string }[] = [
    { value: "all", label: "All sessions" },
    { value: "direct", label: "Direct" },
    { value: "organic", label: "Organic" },
    { value: "paid", label: "Paid" },
    { value: "mobile", label: "Mobile users" },
    { value: "returning", label: "Returning users" },
  ];
  const metric = computed(() => prefs.value?.metric ?? "sessions");
  const annotations = computed(
    () => state.value?.annotations.filter((item) => item.siteId === site.value?.id) ?? []
  );
  const widgets = computed(() => (prefs.value?.widgets ?? []).filter((item) => item.visible));
  const wide = (id: WidgetId) => id === "trend";

  const pageRows = computed<RankedRow[] | null>(() => {
    const rows = current.value?.pages;
    if (!rows) return null;
    const total = rows.reduce((sum, row) => sum + row.views, 0) || 1;
    return rows.map((row: PageRow) => ({
      key: row.path,
      label: row.title,
      sessions: row.views,
      visitors: row.visitors,
      share: row.views / total,
      change: row.change,
      bounceRate: row.bounceRate,
    }));
  });

  // The "visitors right now" tile ticks like the live feed does, from the fixed demo clock.
  const minute = ref(referenceHour * 60 + 20);
  if (import.meta.client) useIntervalFn(() => minute.value++, 20_000);
  const live = computed(() => (site.value ? liveVisitors(site.value, minute.value) : 0));

  function toggle(key: "channel" | "device" | "country" | "page", value: string) {
    const now = prefs.value?.filters[key];
    setFilter(key, (now === value ? "" : value) as never);
  }
  const route = useRoute();
  async function share() {
    try {
      await navigator.clipboard.writeText(`${location.origin}${route.fullPath}`);
      useSonner.success("Link copied", { description: "It opens this exact view." });
    } catch {
      useSonner.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }
  const comparison = computed(() => {
    const report = current.value;
    if (!report?.previous) return "";
    const change = pctChange(report.totals.sessions, report.previous.sessions);
    return change === null
      ? ""
      : `${Math.abs(change).toFixed(1)}% ${change >= 0 ? "more" : "fewer"} sessions than the previous period.`;
  });
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Site overview"
      :description="`Traffic for ${site?.name ?? 'your site'}${site ? ' (' + site.domain + ')' : ''}. ${comparison}`"
    >
      <UiButton variant="outline" @click="share"><Icon name="lucide:link" />Share link</UiButton>
      <UiButton variant="outline" @click="customizing = true">
        <Icon name="lucide:sliders-horizontal" />Customize
      </UiButton>
      <UiButton variant="outline" :loading="pending" @click="refresh()">
        <Icon name="lucide:refresh-cw" />Refresh
      </UiButton>
    </BeaconPageHeader>

    <UiTabs
      :model-value="prefs?.segment ?? 'all'"
      class="mb-4"
      @update:model-value="setSegment($event as Segment)"
    >
      <div class="overflow-x-auto pb-1">
        <UiTabsList aria-label="Traffic segment">
          <UiTabsTrigger v-for="tab in segmentTabs" :key="tab.value" :value="tab.value">
            {{ tab.label }}
          </UiTabsTrigger>
        </UiTabsList>
      </div>
    </UiTabs>

    <BeaconFilterBar />
    <BeaconError :message="error" class="mb-4" />

    <section aria-label="Key figures" class="mb-6 grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-5">
      <BeaconStatCard
        v-for="item in stats"
        :key="item"
        :metric="item"
        :report="current"
        :active="metric === item"
        @select="prefs && (prefs.metric = $event)"
      />
      <UiCard>
        <UiCardContent class="flex h-full flex-col justify-between gap-2">
          <p class="flex items-center gap-2 text-sm text-muted-foreground">
            <span class="relative flex size-2">
              <span
                class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none"
              />
              <span class="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Visitors right now
          </p>
          <p class="text-3xl font-semibold tracking-tight tabular-nums">{{ formatNumber(live) }}</p>
          <UiButton to="/live" variant="link" class="h-auto justify-start p-0">
            Open live feed <Icon name="lucide:arrow-right" />
          </UiButton>
        </UiCardContent>
      </UiCard>
    </section>

    <div class="grid gap-6 @4xl:grid-cols-2">
      <template v-for="widget in widgets" :key="widget.id">
        <UiCard v-if="widget.id === 'trend'" :class="wide(widget.id) && '@4xl:col-span-2'">
          <UiCardHeader>
            <UiCardTitle as="h2" class="text-base"
              >{{ metricLabels[metric] }} over time</UiCardTitle
            >
            <UiCardDescription>
              Pick a figure above to change the chart. Numbered markers are notes on the site's
              timeline.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <BeaconTrendChart :report="current" :metric="metric" :annotations="annotations" />
          </UiCardContent>
        </UiCard>
        <BeaconRankedList
          v-else-if="widget.id === 'pages'"
          title="Top pages by traffic"
          description="Pageviews. Select a page to filter the whole report."
          unit="Pageviews"
          :rows="pageRows"
          selectable
          :selected="prefs?.filters.page"
          @select="toggle('page', $event)"
        />
        <BeaconRankedList
          v-else-if="widget.id === 'sources'"
          title="Top sources"
          description="Where sessions came from."
          :rows="current?.channels ?? null"
          selectable
          :selected="prefs?.filters.channel"
          @select="toggle('channel', $event)"
        />
        <BeaconRankedList
          v-else-if="widget.id === 'countries'"
          title="Countries"
          :rows="current?.countries ?? null"
          selectable
          :selected="prefs?.filters.country"
          @select="toggle('country', $event)"
        />
        <BeaconRankedList
          v-else-if="widget.id === 'devices'"
          title="Devices"
          :rows="current?.devices ?? null"
          selectable
          :selected="prefs?.filters.device"
          @select="toggle('device', $event)"
        />
      </template>
    </div>
    <BeaconEmpty
      v-if="!widgets.length"
      title="Nothing to show"
      description="Every section is hidden. Turn some back on from Customize."
      icon="lucide:layout-dashboard"
    >
      <UiButton @click="customizing = true">Customize overview</UiButton>
    </BeaconEmpty>
    <BeaconCustomizeSheet v-model:open="customizing" />
  </div>
</template>
