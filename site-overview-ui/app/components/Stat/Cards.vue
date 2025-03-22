<template>
  <div class="@container">
    <ClientOnly>
      <template #fallback>
        <div
          class="@desktopUp:mt-8 mt-6 grid grid-cols-1 gap-6 @[550px]:grid-cols-2 @[1100px]:grid-cols-4"
        >
          <div
            v-for="item in 4"
            :key="item"
            class="h-[200px] animate-pulse rounded-lg bg-muted"
          ></div>
        </div>
      </template>
      <draggable
        v-model="stats"
        tag="div"
        item-key="title"
        handle=".handle"
        class="@desktopUp:mt-8 mt-6 grid grid-cols-1 gap-6 @[550px]:grid-cols-2 @[1100px]:grid-cols-4"
      >
        <template #item="{ element }">
          <StatItem :id="`draggable-item-${element.value}`" v-bind="element" />
        </template>
      </draggable>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
  import { useStorage } from "@vueuse/core";
  import draggable from "vuedraggable";

  const stats = useStorage("site-overview-stats", [
    { title: "Total sessions", value: "512", increase: 2.4 },
    { title: "Session duration", value: "2:24s", increase: 8.5 },
    { title: "Pages per session", value: "2.1", increase: 6.5 },
    { title: "Bounce rate", value: "40.5%" },
  ]);
</script>
