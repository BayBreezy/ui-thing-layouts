<template>
  <VueApexCharts v-bind="forwarded" />
</template>

<script lang="ts" setup>
  import { useForwardPropsEmits } from "radix-vue";
  import VueApexCharts from "vue3-apexcharts";
  import type { ApexOptions } from "apexcharts";

  const props = withDefaults(
    defineProps<{
      /**
       * All the optional configuration of the chart goes in this property
       *
       * @default {}
       */
      options?: ApexOptions;
      /**
       * The chart type
       *
       * @default 'line'
       */
      type?:
        | "line"
        | "area"
        | "bar"
        | "histogram"
        | "pie"
        | "donut"
        | "radialBar"
        | "rangeBar"
        | "scatter"
        | "bubble"
        | "heatmap"
        | "candlestick"
        | "radar"
        | "polarArea";
      /**
       * The data which you want to display in the chart
       *
       * @default []
       */
      series?: ApexOptions["series"];
      /**
       * Width of the chart
       *
       * @default '100%'
       */
      width?: string | number;
      /**
       * Height of the chart
       *
       * @default '100%'
       */
      height?: string | number;
    }>(),
    {
      series: () => [],
      type: "line",
      width: "100%",
      height: "100%",
      options: () => ({}),
    }
  );

  const emits = defineEmits([
    "animationEnd",
    "beforeMount",
    "mounted",
    "updated",
    "click",
    "mouseMove",
    "mouseLeave",
    "legendClick",
    "markerClick",
    "selection",
    "dataPointSelection",
    "dataPointMouseEnter",
    "dataPointMouseLeave",
    "beforeZoom",
    "beforeResetZoom",
    "zoomed",
    "scrolled",
    "brushScrolled",
  ]);

  const forwarded = useForwardPropsEmits(props, emits);
</script>

<style scoped>
  :deep(.apexcharts-tooltip) {
    @apply !rounded-md !border-border !bg-background !shadow-md !shadow-blue-500/10;
    .apexcharts-tooltip-title {
      @apply !border-b-border !bg-muted !text-foreground;
    }
  }
</style>
