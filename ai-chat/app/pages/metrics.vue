<script setup lang="ts">
  import { models, demoReferenceDate } from "#shared/types";
  usePageSeo({
    title: "Usage & metrics",
    description:
      "Explore sample usage across fictional Orbit models: requests, tokens, simulated cost, and response time.",
  });
  const { state } = useDemo();
  const days = ref("30");
  const model = ref("all");
  const metric = ref("tokens");
  const events = computed(() => {
    const end = Math.max(new Date(demoReferenceDate).getTime(), Date.now());
    return (
      state.value?.usage.filter(
        (item) =>
          item.workspaceId === state.value?.activeWorkspaceId &&
          (model.value === "all" || item.modelId === model.value) &&
          new Date(item.createdAt).getTime() >= end - Number(days.value) * 86400000
      ) ?? []
    );
  });
  const totals = computed(() => ({
    tokens: events.value.reduce((sum, item) => sum + item.tokens, 0),
    cost: events.value.reduce((sum, item) => sum + item.cost, 0),
    latency: events.value.length
      ? events.value.reduce((sum, item) => sum + item.latencyMs, 0) / events.value.length
      : 0,
  }));
  const grouped = computed(() => {
    const groups = new Map<string, { tokens: number; cost: number }>();
    for (const item of events.value) {
      const date = item.createdAt.slice(0, 10);
      const value = groups.get(date) ?? { tokens: 0, cost: 0 };
      value.tokens += item.tokens;
      value.cost += item.cost;
      groups.set(date, value);
    }
    return [...groups].sort(([a], [b]) => a.localeCompare(b));
  });
  const series = computed(() => [
    {
      name: metric.value === "tokens" ? "Tokens" : "Simulated cost",
      data: grouped.value.map(([date, value]) => ({
        x: new Date(date).getTime(),
        y: metric.value === "tokens" ? value.tokens : Number(value.cost.toFixed(4)),
      })),
    },
  ]);
  const options = {
    colors: ["var(--color-primary)"],
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    xaxis: { type: "datetime" as const },
    fill: { type: "gradient", gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
    stroke: { width: 2 },
    tooltip: { x: { format: "MMM dd" } },
  };
  const stats = computed(() => [
    {
      name: "Total requests",
      value: events.value.length.toLocaleString(),
      icon: "lucide:activity",
    },
    {
      name: "Tokens processed",
      value: totals.value.tokens.toLocaleString(),
      icon: "lucide:layers",
    },
    { name: "Simulated cost", value: money(totals.value.cost), icon: "lucide:wallet" },
    {
      name: "Avg. response time",
      value: `${(totals.value.latency / 1000).toFixed(2)}s`,
      icon: "lucide:timer",
    },
  ]);
  const recent = computed(() =>
    [...events.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  );
  function requestsFor(modelId: string) {
    return events.value.filter((event) => event.modelId === modelId).length;
  }
  function csv() {
    downloadText(
      "orbit-usage.csv",
      [
        "date,model,source,tokens,cost_usd,latency_ms",
        ...events.value.map(
          (item) =>
            `${item.createdAt},${item.modelId},${item.source},${item.tokens},${item.cost.toFixed(6)},${item.latencyMs}`
        ),
      ].join("\n"),
      "text/csv"
    );
  }
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="A clearer picture of your work"
      description="Understand the small moments that add up to meaningful progress."
    >
      <UiButton variant="outline" @click="csv"><Icon name="lucide:download" />Export CSV</UiButton>
    </OrbitPageHeader>
    <div class="mb-6 flex flex-wrap gap-3">
      <UiSelect v-model="days">
        <UiSelectTrigger aria-label="Date range" class="w-40" />
        <UiSelectContent>
          <UiSelectItem value="7">Last 7 days</UiSelectItem>
          <UiSelectItem value="30">Last 30 days</UiSelectItem>
          <UiSelectItem value="90">Last 90 days</UiSelectItem>
        </UiSelectContent>
      </UiSelect>
      <UiSelect v-model="model">
        <UiSelectTrigger aria-label="Filter by model" class="w-40" />
        <UiSelectContent>
          <UiSelectItem value="all">All models</UiSelectItem>
          <UiSelectItem v-for="item in models" :key="item.id" :value="item.id">
            {{ item.name }}
          </UiSelectItem>
        </UiSelectContent>
      </UiSelect>
    </div>
    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UiCard v-for="stat in stats" :key="stat.name" class="gap-4">
        <UiCardHeader>
          <UiCardDescription>{{ stat.name }}</UiCardDescription>
          <UiCardTitle as="p" class="text-2xl tabular-nums">{{ stat.value }}</UiCardTitle>
          <UiCardAction>
            <Icon :name="stat.icon" class="size-4 text-muted-foreground" />
          </UiCardAction>
        </UiCardHeader>
        <UiCardFooter class="text-xs text-muted-foreground">
          Sample data + your demo activity
        </UiCardFooter>
      </UiCard>
    </div>
    <div class="grid items-start gap-6 lg:grid-cols-3">
      <UiCard class="min-w-0 lg:col-span-2">
        <UiCardHeader>
          <UiCardTitle as="h2">Usage activity</UiCardTitle>
          <UiCardDescription>A daily view across your selected models.</UiCardDescription>
          <UiCardAction>
            <UiTabs v-model="metric">
              <UiTabsList>
                <UiTabsTrigger value="tokens">Tokens</UiTabsTrigger>
                <UiTabsTrigger value="cost">Simulated cost</UiTabsTrigger>
              </UiTabsList>
            </UiTabs>
          </UiCardAction>
        </UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <LazyUiApexchart
              v-if="events.length"
              type="area"
              :height="280"
              :series="series"
              :options="options"
            />
            <OrbitEmptyState
              v-else
              title="No activity in this view"
              description="Change the filters or start a conversation."
              icon="lucide:chart-no-axes-combined"
            />
            <template #fallback><UiSkeleton class="h-70" /></template>
          </ClientOnly>
          <details class="mt-4 text-sm text-muted-foreground">
            <summary class="cursor-pointer">View chart data</summary>
            <UiTable class="mt-3">
              <UiTableCaption class="sr-only">Daily token usage</UiTableCaption>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Date</UiTableHead>
                  <UiTableHead>Tokens</UiTableHead>
                  <UiTableHead>Simulated cost</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <UiTableRow v-for="[date, value] in grouped" :key="date">
                  <UiTableCell>{{ date }}</UiTableCell>
                  <UiTableCell>{{ value.tokens.toLocaleString() }}</UiTableCell>
                  <UiTableCell>{{ money(value.cost) }}</UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>
          </details>
        </UiCardContent>
      </UiCard>
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Model breakdown</UiCardTitle>
          <UiCardDescription>
            Fictional models and pricing. These figures demonstrate an analytics interface; no
            billing occurs.
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-5">
          <div v-for="item in models" :key="item.id" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>{{ item.name }}</span>
              <span class="text-muted-foreground">{{ requestsFor(item.id) }} requests</span>
            </div>
            <UiProgress
              :model-value="events.length ? (requestsFor(item.id) / events.length) * 100 : 0"
              :aria-label="`${item.name} share of requests`"
            />
          </div>
        </UiCardContent>
      </UiCard>
    </div>
    <UiCard class="mt-6">
      <UiCardHeader>
        <UiCardTitle as="h2">Recent activity</UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <UiTable>
          <UiTableCaption class="sr-only">Recent requests</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Source</UiTableHead>
              <UiTableHead>Model</UiTableHead>
              <UiTableHead>Tokens</UiTableHead>
              <UiTableHead>Cost</UiTableHead>
              <UiTableHead>Date</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="item in recent" :key="item.id">
              <UiTableCell class="capitalize">{{ item.source }}</UiTableCell>
              <UiTableCell>{{ models.find((m) => m.id === item.modelId)?.name }}</UiTableCell>
              <UiTableCell class="font-mono">{{ item.tokens }}</UiTableCell>
              <UiTableCell class="font-mono">{{ money(item.cost) }}</UiTableCell>
              <UiTableCell class="text-muted-foreground">{{
                shortDate(item.createdAt)
              }}</UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
  </div>
</template>
