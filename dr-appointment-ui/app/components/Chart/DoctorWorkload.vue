<template>
  <UiCard id="doctor-workload">
    <UiCardContent>
      <UiCardTitle>Doctor Workload</UiCardTitle>
      <UiCardDescription class="mt-1">
        Workload distribution of doctors in the past week.
      </UiCardDescription>

      <div class="mt-5 h-[300px]">
        <ClientOnly>
          <template #fallback>
            <UiSkeleton class="size-full" />
          </template>
          <Apexchart :series :options type="bar" />
        </ClientOnly>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  import { _blue, _primary } from "#tailwind-config/theme/colors";
  import type { ApexOptions } from "apexcharts";

  const count = 12;
  const series: ApexOptions["series"] = [
    {
      name: "# of Patients",
      data: Array.from({ length: count }, () => faker.number.int({ min: 1, max: 10 })),
    },
  ];

  const options: ApexOptions = {
    chart: { zoom: { enabled: false }, toolbar: { show: false } },
    xaxis: {
      labels: { show: false },
      categories: Array.from(
        { length: count },
        (_) => `Dr. ${faker.person.firstName()}. ${faker.person.lastName()}.`
      ),
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      bar: {
        borderRadius: 2,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    yaxis: { show: false },
    colors: [_primary["DEFAULT"]],
  };
</script>
