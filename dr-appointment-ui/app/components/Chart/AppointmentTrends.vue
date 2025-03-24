<template>
  <UiCard>
    <UiCardContent>
      <UiCardTitle>Appointments Trends</UiCardTitle>
      <UiCardDescription class="mt-1">
        Appointment trends for the last {{ count }} days
      </UiCardDescription>

      <div class="mt-5 h-[300px]">
        <ClientOnly>
          <template #fallback>
            <UiSkeleton class="size-full" />
          </template>
          <Apexchart :series :options type="area" />
        </ClientOnly>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  import { _blue, _emerald } from "#tailwind-config/theme/colors";
  import dayjs from "dayjs";
  import type { ApexOptions } from "apexcharts";

  const count = 9;
  const series: ApexOptions["series"] = [
    {
      name: "Appointments",
      data: [30, 56, 45, 66, 82, 63, 90, 80, 110],
    },
  ];

  const options: ApexOptions = {
    chart: { zoom: { enabled: false }, toolbar: { show: false } },
    xaxis: {
      categories: Array.from({ length: count }, (_, i) =>
        dayjs()
          .subtract(i + 1, "day")
          .format("DD MMM")
      ).reverse(),
    },
    dataLabels: {
      style: { fontSize: "10px" },
      background: {
        borderColor: _emerald["300"],
      },
    },
    yaxis: { show: false },
    colors: [_emerald["500"]],
  };
</script>
