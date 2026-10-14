<script setup lang="ts">
  import { formatMetric, metricLabels, pctChange } from "#shared/format";
  import type { Metric, ReportResult } from "#shared/types";

  const props = defineProps<{
    metric: Metric;
    report: ReportResult | null;
    active: boolean;
  }>();
  defineEmits<{ select: [metric: Metric] }>();

  const value = computed(() => {
    if (!props.report) return null;
    const totals = props.report.totals;
    return totals[props.metric as keyof typeof totals] as number;
  });
  const change = computed(() => {
    const previous = props.report?.previous;
    if (!previous || value.value === null) return null;
    return pctChange(value.value, previous[props.metric as keyof typeof previous] as number);
  });
  const points = computed(() => props.report?.series.map((point) => point[props.metric]) ?? []);
  const options = computed(() => ({
    chart: {
      sparkline: { enabled: true },
      animations: { enabled: false },
      toolbar: { show: false },
    },
    stroke: { curve: "smooth" as const, width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.28, opacityTo: 0.02 } },
    colors: ["var(--color-primary)"],
    tooltip: { enabled: false },
  }));
</script>
<template>
  <button
    type="button"
    :aria-pressed="active"
    :class="[
      'group flex w-full flex-col rounded-xl border bg-card p-4 text-left shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
      active ? 'border-primary ring-1 ring-primary' : 'hover:border-foreground/30',
    ]"
    @click="$emit('select', metric)"
  >
    <span class="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      {{ metricLabels[metric] }}
      <BeaconDelta
        v-if="change !== null"
        :change="change"
        :invert="metric === 'bounceRate'"
        context="compared with the previous period"
      />
    </span>
    <span class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
      <UiSkeleton v-if="value === null" class="inline-block h-8 w-24" />
      <template v-else>{{ formatMetric(metric, value) }}</template>
    </span>
    <span class="mt-3 block h-12" aria-hidden="true" inert>
      <ClientOnly>
        <LazyUiApexchart
          v-if="points.length > 1"
          type="area"
          height="48"
          :series="[{ name: metricLabels[metric], data: points }]"
          :options="options"
        />
        <template #fallback><UiSkeleton class="h-12" /></template>
      </ClientOnly>
    </span>
  </button>
</template>
