<script setup lang="ts">
  import { filteredPerformance, metrics } from "#shared/demo";
  import { channels, referenceDate } from "#shared/types";
  const props = defineProps<{ campaignId?: string }>();
  const uid = useId();
  const { state } = useDemo();
  const start = ref("2026-09-13");
  const end = ref(referenceDate);
  const channel = ref("");
  const table = ref(false);
  const validRange = computed(() => !start.value || !end.value || start.value <= end.value);
  const samples = computed(() =>
    state.value && validRange.value
      ? filteredPerformance(state.value, start.value, end.value, channel.value, props.campaignId)
      : []
  );
  const total = computed(() => metrics(samples.value));
  const daily = computed(() => {
    const days = [...new Set(samples.value.map((s) => s.date))].sort();
    return days.map((date) => ({ date, ...metrics(samples.value.filter((s) => s.date === date)) }));
  });
  const previous = computed(() => {
    if (!state.value || !start.value || !end.value || !validRange.value) return metrics([]);
    const length = Math.round((Date.parse(end.value) - Date.parse(start.value)) / 86400000) + 1;
    const priorEnd = new Date(Date.parse(start.value) - 86400000).toISOString().slice(0, 10);
    const priorStart = new Date(Date.parse(start.value) - length * 86400000)
      .toISOString()
      .slice(0, 10);
    return metrics(
      filteredPerformance(state.value, priorStart, priorEnd, channel.value, props.campaignId)
    );
  });
  const change = computed(() =>
    previous.value.revenue
      ? (((total.value.revenue - previous.value.revenue) / previous.value.revenue) * 100).toFixed(1)
      : null
  );
  const series = computed(() => [
    {
      name: "Revenue",
      data: daily.value.map((d) => ({ x: Date.parse(d.date), y: d.revenue })),
    },
    {
      name: "Spend",
      data: daily.value.map((d) => ({ x: Date.parse(d.date), y: d.spend })),
    },
  ]);
  const options = {
    colors: ["var(--color-primary)", "var(--color-muted-foreground)"],
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    xaxis: { type: "datetime" as const },
    yaxis: { labels: { formatter: (value: number) => "$" + Math.round(value) } },
    fill: { type: "gradient", gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
    stroke: { width: 2 },
    tooltip: { x: { format: "MMM dd" } },
  };
  const stats = computed(() => [
    { label: "Total spend", value: money(total.value.spend), icon: "lucide:wallet" },
    {
      label: "Return on ad spend",
      value: total.value.roas.toFixed(2) + "x",
      icon: "lucide:trending-up",
    },
    {
      label: "Orders",
      value: total.value.orders.toLocaleString("en-US"),
      icon: "lucide:shopping-bag",
    },
    {
      label: "Click-through rate",
      value: total.value.ctr.toFixed(2) + "%",
      icon: "lucide:mouse-pointer-2",
    },
  ]);
  function exportResults() {
    downloadFile(
      "launchpad-results.csv",
      csv([
        ["Date", "Revenue (USD)", "Spend (USD)", "Orders", "Clicks", "Impressions"],
        ...daily.value.map((d) => [d.date, d.revenue, d.spend, d.orders, d.clicks, d.impressions]),
      ]),
      "text/csv"
    );
  }
</script>
<template>
  <section aria-label="Campaign performance" class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <p class="text-sm text-muted-foreground">Attributed revenue</p>
        <p class="text-4xl font-semibold tracking-tight tabular-nums" data-testid="revenue">
          {{ money(total.revenue) }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{
            change === null
              ? "No comparison data for the preceding period"
              : (Number(change) >= 0 ? "+" : "") + change + "% vs. preceding period"
          }}
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <div class="space-y-2">
          <UiLabel :for="`${uid}-from`">From</UiLabel>
          <UiInput :id="`${uid}-from`" v-model="start" type="date" class="w-40" />
        </div>
        <div class="space-y-2">
          <UiLabel :for="`${uid}-to`">To</UiLabel>
          <UiInput :id="`${uid}-to`" v-model="end" type="date" class="w-40" />
        </div>
        <div v-if="!campaignId" class="space-y-2">
          <UiLabel :for="`${uid}-channel`">Channel</UiLabel>
          <UiNativeSelect :id="`${uid}-channel`" v-model="channel" class="w-40">
            <option value="">All channels</option>
            <option v-for="item in channels" :key="item">{{ item }}</option>
          </UiNativeSelect>
        </div>
      </div>
    </div>
    <LaunchpadError
      :message="validRange ? '' : 'The end date must be on or after the start date.'"
    />
    <div class="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
      <UiCard v-for="stat in stats" :key="stat.label" class="gap-4">
        <UiCardHeader>
          <UiCardDescription>{{ stat.label }}</UiCardDescription>
          <UiCardTitle as="p" class="text-2xl tabular-nums">{{ stat.value }}</UiCardTitle>
          <UiCardAction>
            <Icon :name="stat.icon" class="size-4 text-muted-foreground" />
          </UiCardAction>
        </UiCardHeader>
      </UiCard>
    </div>
    <UiCard class="min-w-0">
      <UiCardHeader>
        <UiCardTitle as="h2">Campaign performance</UiCardTitle>
        <UiCardDescription>Illustrative results · fixed demo reporting period</UiCardDescription>
        <UiCardAction class="flex gap-2">
          <UiButton variant="ghost" size="sm" :aria-expanded="table" @click="table = !table">
            {{ table ? "Hide data table" : "View data table" }}
          </UiButton>
          <UiButton variant="outline" size="sm" @click="exportResults">
            <Icon name="lucide:download" />Export CSV
          </UiButton>
        </UiCardAction>
      </UiCardHeader>
      <UiCardContent>
        <ClientOnly>
          <LazyUiApexchart
            v-if="samples.length"
            type="area"
            :height="280"
            :series="series"
            :options="options"
          />
          <LaunchpadEmpty
            v-else
            title="No performance samples"
            description="There is nothing to chart in this period. Try a wider date range."
            icon="lucide:chart-no-axes-combined"
          />
          <template #fallback><UiSkeleton class="h-70" /></template>
        </ClientOnly>
        <UiTable v-if="table" class="mt-4">
          <UiTableCaption class="sr-only">Daily campaign performance in US dollars</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Date</UiTableHead>
              <UiTableHead>Revenue</UiTableHead>
              <UiTableHead>Spend</UiTableHead>
              <UiTableHead>Orders</UiTableHead>
              <UiTableHead>Clicks</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="row in daily" :key="row.date">
              <UiTableCell>{{ dateLabel(row.date) }}</UiTableCell>
              <UiTableCell>{{ money(row.revenue) }}</UiTableCell>
              <UiTableCell>{{ money(row.spend) }}</UiTableCell>
              <UiTableCell>{{ row.orders }}</UiTableCell>
              <UiTableCell>{{ row.clicks }}</UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
      <UiCardFooter class="gap-5 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-2">
          <span class="size-2 rounded-full bg-primary" />Revenue
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="size-2 rounded-full bg-muted-foreground" />Spend
        </span>
      </UiCardFooter>
    </UiCard>
  </section>
</template>
