<template>
  <UiCard class="">
    <UiCardContent>
      <div class="mb-4 flex items-center justify-between">
        <p class="font-semibold">{{ title }}</p>
        <Icon
          v-tippy="'Drag to reorder'"
          name="i:dots-grid"
          class="handle size-6 cursor-grab text-muted-foreground/50 active:cursor-grabbing"
        />
      </div>
      <div class="mb-1 flex items-center gap-3">
        <h2 class="text-3xl font-bold tabular-nums">{{ value }}</h2>
        <UiBadge
          v-if="increase"
          variant="outline"
          class="flex items-center gap-1.5 rounded-md p-1 text-green-600"
        >
          <Icon name="i:trend-up-01" class="size-4 shrink-0 stroke-2" />
          <span class="font-bold">{{ increase }}%</span>
        </UiBadge>
      </div>
      <div class="h-[80px] w-full">
        <ClientOnly>
          <template #fallback>
            <div class="size-full animate-pulse rounded-md bg-muted"></div>
          </template>
          <Apexchart type="area" :series :options />
        </ClientOnly>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  import { _blue } from "#tailwind-config/theme/colors";
  import type { ApexOptions } from "apexcharts";

  const props = defineProps<{
    title: string;
    value: string;
    increase?: number;
  }>();

  const series: ApexOptions["series"] = [
    {
      name: props.title,
      data: Array.from({ length: 9 }, () => faker.number.int({ min: 25, max: 140 })),
    },
  ];

  const options: ApexOptions = {
    chart: {
      sparkline: { enabled: true },
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    },
    yaxis: { show: false },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.5,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    colors: [_blue["600"]],
    stroke: { width: 2, curve: "smooth", lineCap: "round" },
  };
</script>

<style scoped>
  .sortable-ghost {
    @apply border-blue-500 bg-muted;
  }
  .sortable-drag {
    @apply rotate-3 select-none;
  }
  .sortable-chosen {
    @apply border-blue-500;
  }
</style>
