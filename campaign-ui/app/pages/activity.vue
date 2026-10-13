<script setup lang="ts">
  const { state } = useDemo();
  usePageSeo({ title: "Studio activity" });
  const search = ref("");
  const items = computed(
    () =>
      state.value?.activity.filter((a) =>
        a.title.toLowerCase().includes(search.value.toLowerCase())
      ) ?? []
  );
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="A little momentum, recorded."
      description="Campaign changes, new connections, and shared ideas from around your workspace."
    />
    <UiInputGroup class="mb-4 w-full sm:w-72">
      <UiInputGroupAddon><Icon name="lucide:search" /></UiInputGroupAddon>
      <UiInputGroupInput
        v-model="search"
        aria-label="Search activity"
        placeholder="Search activity…"
      />
    </UiInputGroup>
    <UiCard v-if="items.length" class="gap-0 divide-y overflow-hidden py-0">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="item.href"
        class="flex items-center justify-between gap-5 p-4 text-sm transition-colors hover:bg-muted/50"
      >
        <span>{{ item.title }}</span>
        <span class="shrink-0 text-xs text-muted-foreground">{{ dateLabel(item.createdAt) }}</span>
      </NuxtLink>
    </UiCard>
    <LaunchpadEmpty v-else title="No activity to show" icon="lucide:activity" />
  </div>
</template>
