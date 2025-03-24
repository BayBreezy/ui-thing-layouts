<template>
  <UiCard>
    <UiCardContent>
      <UiCardTitle>Avg. Appointment Duration</UiCardTitle>
      <UiCardDescription class="mt-1"> Duration of doctors in the past week. </UiCardDescription>

      <div class="mt-5 h-[300px]">
        <ClientOnly>
          <template #fallback>
            <UiSkeleton class="size-full" />
          </template>
          <Apexchart :series :options type="pie" />
        </ClientOnly>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  import { _blue, _emerald, _primary } from "#tailwind-config/theme/colors";
  import type { ApexOptions } from "apexcharts";

  const series: ApexOptions["series"] = [20, 35, 25, 15, 5];

  const options: ApexOptions = {
    labels: ["< 15 min", "15 - 30 min", "30 - 45 min", "45 - 60 min", "> 60 min"],
    yaxis: { show: false },
    theme: { monochrome: { enabled: true, color: _emerald["500"], shadeTo: "dark" } },
    legend: { show: false },
    stroke: { show: false },
    dataLabels: {
      formatter(val, opts) {
        const name = opts.w.globals.labels[opts.seriesIndex];
        return [name, val];
      },
    },
  };
</script>
