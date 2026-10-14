<script setup lang="ts">
  import { formatDay, formatMetric, metricLabels } from "#shared/format";
  import type { Annotation, Metric, ReportResult } from "#shared/types";

  const props = defineProps<{
    report: ReportResult | null;
    metric: Metric;
    annotations: Annotation[];
  }>();
  const stamp = (date: string) => Date.parse(`${date}T00:00:00Z`);

  const series = computed(() => {
    const report = props.report;
    if (!report) return [];
    const list = [
      {
        name: metricLabels[props.metric],
        data: report.series.map((point) => ({ x: stamp(point.date), y: point[props.metric] })),
      },
    ];
    // The previous period is drawn on the current period's dates so the two lines overlay.
    if (report.previousSeries.length)
      list.push({
        name: "Previous period",
        data: report.series.map((point, index) => ({
          x: stamp(point.date),
          y: report.previousSeries[index]?.[props.metric] ?? 0,
        })),
      });
    return list;
  });
  const visibleNotes = computed(() => {
    const report = props.report;
    if (!report) return [];
    return props.annotations.filter(
      (item) => item.date >= report.query.from && item.date <= report.query.to
    );
  });
  const options = computed(() => ({
    colors: ["var(--color-primary)", "#94a3b8"],
    chart: {
      type: "area" as const,
      animations: { enabled: false },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { width: [2.5, 1.5], curve: "smooth" as const, dashArray: [0, 5] },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.22, opacityTo: 0.02, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    legend: { show: Boolean(props.report?.previousSeries.length), position: "top" as const },
    grid: { strokeDashArray: 4 },
    xaxis: {
      type: "datetime" as const,
      labels: {
        datetimeUTC: true,
        format: props.report?.interval === "week" ? "MMM dd" : "MMM dd",
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      labels: { formatter: (value: number) => formatMetric(props.metric, value) },
    },
    tooltip: {
      shared: true,
      x: { format: props.report?.interval === "week" ? "'Week of' MMM dd" : "ddd, MMM dd" },
      y: { formatter: (value: number) => formatMetric(props.metric, value) },
    },
    annotations: {
      xaxis: visibleNotes.value.map((item) => ({
        x: stamp(item.date),
        borderColor: item.kind === "incident" ? "#b91c1c" : "#64748b",
        strokeDashArray: 3,
        label: {
          text: String(visibleNotes.value.indexOf(item) + 1),
          borderWidth: 0,
          style: {
            color: "#fff",
            background: item.kind === "incident" ? "#b91c1c" : "#475569",
          },
        },
      })),
    },
  }));

  const summary = computed(() => {
    const points = props.report?.series ?? [];
    if (!points.length) return "No data for this range.";
    const peak = points.reduce((best, point) =>
      point[props.metric] > best[props.metric] ? point : best
    );
    return `${metricLabels[props.metric]} by ${props.report?.interval}. Highest: ${formatMetric(props.metric, peak[props.metric])} on ${formatDay(peak.date, true)}.`;
  });
</script>
<template>
  <div>
    <ClientOnly>
      <LazyUiApexchart v-if="report" type="area" height="320" :series="series" :options="options" />
      <UiSkeleton v-else class="h-80" />
      <template #fallback><UiSkeleton class="h-80" /></template>
    </ClientOnly>
    <p class="sr-only" role="status">{{ summary }}</p>
    <ol
      v-if="visibleNotes.length"
      class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"
      aria-label="Annotations on this chart"
    >
      <li v-for="(item, index) in visibleNotes" :key="item.id" class="flex items-center gap-1.5">
        <span
          :class="[
            'inline-flex size-4 items-center justify-center rounded-sm text-[10px] font-medium text-white',
            item.kind === 'incident' ? 'bg-red-700' : 'bg-slate-600',
          ]"
          >{{ index + 1 }}</span
        >
        {{ formatDay(item.date) }} · {{ item.label }}
      </li>
    </ol>
  </div>
</template>
