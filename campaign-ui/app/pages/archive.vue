<script setup lang="ts">
  const { state, saveCampaign } = useDemo();
  const search = ref("");
  usePageSeo({ title: "Archive" });
  const { pending, error, run } = useAction();
  const campaigns = computed(
    () =>
      state.value?.campaigns.filter(
        (c) => c.archived && c.name.toLowerCase().includes(search.value.toLowerCase())
      ) ?? []
  );
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Good work, kept close."
      description="Archived campaigns retain their results and linked records. Bring one back whenever you need it."
    />
    <UiInputGroup class="mb-4 w-full sm:w-72">
      <UiInputGroupAddon><Icon name="lucide:search" /></UiInputGroupAddon>
      <UiInputGroupInput
        v-model="search"
        aria-label="Search archive"
        placeholder="Search archived campaigns…"
      />
    </UiInputGroup>
    <LaunchpadError :message="error" class="mb-4" />
    <UiCard v-if="campaigns.length" class="gap-0 divide-y overflow-hidden py-0">
      <article
        v-for="campaign in campaigns"
        :key="campaign.id"
        class="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <NuxtLink :to="'/campaigns/' + campaign.id" class="min-w-0 space-y-1">
          <h2 class="truncate text-sm font-medium">{{ campaign.name }}</h2>
          <p class="text-xs text-muted-foreground">
            {{ campaign.channel }} · {{ campaign.status }}
          </p>
        </NuxtLink>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="pending"
          @click="run(() => saveCampaign({ ...clone(campaign), archived: false }))"
        >
          <Icon name="lucide:archive-restore" />Restore
        </UiButton>
      </article>
    </UiCard>
    <LaunchpadEmpty
      v-else
      title="Nothing tucked away here"
      description="Archived campaigns will appear here. Your historical reporting stays intact."
      icon="lucide:archive"
    />
  </div>
</template>
