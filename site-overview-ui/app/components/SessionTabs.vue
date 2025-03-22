<template>
  <ClientOnly>
    <template #fallback>
      <div class="flex items-center gap-3 overflow-x-auto py-2">
        <div
          v-for="n in 8"
          :key="n"
          class="h-10 w-[100px] shrink-0 animate-pulse rounded-full bg-muted"
        ></div>
      </div>
    </template>
    <Tabs.Root v-model="currentTab">
      <Tabs.List loop class="flex items-center gap-3 overflow-x-auto py-2">
        <Tabs.Trigger
          v-for="item in tabs"
          :key="item.label"
          v-wave
          class="flex h-10 items-center justify-center whitespace-nowrap rounded-full border bg-background px-4 text-sm font-semibold text-muted-foreground/80 focus-visible:outline-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[active=true]:[box-shadow:inset_0_2px_0_theme(colors.primary.foreground/20%),0_3px_6px_theme(colors.primary.DEFAULT/10%)]"
          :value="item.value"
        >
          {{ item.label }}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </ClientOnly>
</template>

<script lang="ts" setup>
  import { useStorage } from "@vueuse/core";
  import { Tabs } from "radix-vue/namespaced";

  const currentTab = useStorage("site-overview-current-tab", "all");
  const tabs = [
    { label: "All sessions", value: "all" },
    { label: "Direct traffic", value: "direct-traffic" },
    { label: "Organic traffic", value: "organic-traffic" },
    { label: "Paid traffic", value: "paid-traffic" },
    { label: "Mobile users", value: "mobile-users" },
    { label: "Returning users", value: "returning-users" },
  ];
</script>
