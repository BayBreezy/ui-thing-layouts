<script setup lang="ts">
  import { formatNumber, formatPercent } from "#shared/format";
  import type { RankedRow } from "#shared/types";

  const props = defineProps<{
    title: string;
    description?: string;
    rows: RankedRow[] | null;
    type?: "donut" | "bar";
  }>();
  const palette = ["#c2410c", "#0369a1", "#d97706", "#475569", "#0e7490", "#78716c"];
  const rows = computed(() => props.rows ?? []);
  const series = computed(() =>
    props.type === "bar"
      ? [{ name: "Sessions", data: rows.value.map((row) => row.sessions) }]
      : rows.value.map((row) => row.sessions)
  );
  const options = computed(() => ({
    labels: rows.value.map((row) => row.label),
    colors: palette,
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    legend: { show: props.type !== "bar", position: "bottom" as const },
    dataLabels: { enabled: false },
    stroke: { width: props.type === "bar" ? 0 : 2, colors: ["var(--color-card)"] },
    plotOptions:
      props.type === "bar"
        ? {
            bar: {
              horizontal: true,
              distributed: true,
              borderRadius: 4,
              barHeight: "60%",
            },
          }
        : { pie: { donut: { size: "64%" } } },
    xaxis: props.type === "bar" ? { categories: rows.value.map((row) => row.label) } : {},
    grid: { show: false },
    tooltip: { y: { formatter: (value: number) => `${formatNumber(value)} sessions` } },
  }));
</script>
<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle as="h2" class="text-base">{{ title }}</UiCardTitle>
      <UiCardDescription v-if="description">{{ description }}</UiCardDescription>
    </UiCardHeader>
    <UiCardContent>
      <ClientOnly>
        <LazyUiApexchart
          v-if="rows.length"
          :type="type === 'bar' ? 'bar' : 'donut'"
          height="260"
          :series="series"
          :options="options"
        />
        <p v-else-if="rows" class="py-16 text-center text-sm text-muted-foreground">
          No traffic matches these filters.
        </p>
        <UiSkeleton v-else class="h-65" />
        <template #fallback><UiSkeleton class="h-65" /></template>
      </ClientOnly>
      <ul class="sr-only" :aria-label="`${title} data`">
        <li v-for="row in rows" :key="row.key">
          {{ row.label }}: {{ formatNumber(row.sessions) }} sessions, {{ formatPercent(row.share) }}
        </li>
      </ul>
    </UiCardContent>
  </UiCard>
</template>
