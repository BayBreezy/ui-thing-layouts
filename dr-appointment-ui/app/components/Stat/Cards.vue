<template>
  <div class="@container">
    <ClientOnly>
      <template #fallback>
        <div class="mt-6 grid grid-cols-1 gap-6 @[850px]:grid-cols-3">
          <div
            v-for="item in 3"
            :key="item"
            class="h-[200px] animate-pulse rounded-lg bg-muted"
          ></div>
        </div>
      </template>
      <div class="overflow-x-auto overflow-y-hidden">
        <draggable
          v-model="stats"
          tag="div"
          item-key="id"
          handle=".handle"
          class="mt-6 grid grid-cols-1 gap-6 @[850px]:grid-cols-3"
        >
          <template #item="{ element }">
            <StatCard :id="`draggable-item-${element.value}`" v-bind="element" />
          </template>
        </draggable>
      </div>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
  import { useStorage } from "@vueuse/core";
  import draggable from "vuedraggable";

  const stats = useStorage("dr-appointment-stats", [
    {
      id: "stat-1",
      title: "Total Patients",
      value: "2,091",
      increase: 3.4,
      icon: "solar:users-group-rounded-bold-duotone",
    },
    {
      id: "stat-2",
      title: "Total Appointments",
      value: "4,372",
      increase: 0.4,
      icon: "solar:calendar-mark-bold-duotone",
    },
    {
      id: "stat-3",
      title: "Total Revenue",
      value: "$12,000",
      increase: 12.4,
      icon: "solar:chat-round-money-bold-duotone",
    },
  ]);
</script>
