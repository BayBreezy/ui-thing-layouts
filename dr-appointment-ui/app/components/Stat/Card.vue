<template>
  <UiCard :id="`stat-${increase}`" class="relative">
    <div class="handle absolute right-5 top-5 flex items-center justify-center">
      <Icon name="solar:cursor-bold-duotone" class="text-muted-foreground/60" />
    </div>
    <UiCardContent>
      <div class="flex items-center gap-3">
        <UiFancyIcon :icon="icon" class="size-10" />
        <p class="font-medium">{{ title }}</p>
      </div>
      <div class="mb-3 mt-4 flex items-center gap-4">
        <h2 class="text-3xl font-bold">{{ value }}</h2>
        <UiBadge
          v-if="increase"
          variant="outline"
          class="flex items-center gap-1.5 rounded-md p-1 text-green-600"
        >
          <Icon name="solar:graph-up-outline" class="size-4 shrink-0 stroke-2" />
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
    icon: string;
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
    colors: [_blue["500"]],
  };
</script>

<style scoped>
  .sortable-ghost {
    @apply border-primary bg-muted;
  }
  .sortable-drag {
    @apply rotate-3 select-none;
  }
  .sortable-chosen {
    @apply border-primary;
  }
</style>
