<script setup lang="ts">
  const { state } = useDemo();
  usePageSeo({ title: "Documents" });
  const search = ref("");
  const favorites = ref(false);
  const briefs = computed(() =>
    [...(state.value?.documents ?? [])]
      .filter(
        (d) =>
          (!favorites.value || d.favorite) &&
          d.title.toLowerCase().includes(search.value.toLowerCase())
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Give your ideas a little structure."
      description="Briefs, notes, and plans. Everything your team needs to make a thoughtful launch."
    >
      <UiButton to="/documents/new"><Icon name="lucide:plus" />New document</UiButton>
    </LaunchpadPageHeader>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <UiInputGroup class="w-full sm:w-72">
        <UiInputGroupAddon><Icon name="lucide:search" /></UiInputGroupAddon>
        <UiInputGroupInput
          v-model="search"
          aria-label="Search documents"
          placeholder="Search documents…"
        />
      </UiInputGroup>
      <UiButton
        :variant="favorites ? 'secondary' : 'outline'"
        :aria-pressed="favorites"
        @click="favorites = !favorites"
      >
        <Icon name="lucide:star" :class="favorites && 'fill-primary text-primary'" />Favorites
      </UiButton>
    </div>
    <div v-if="briefs.length" class="grid gap-4 @xl:grid-cols-2">
      <NuxtLink
        v-for="brief in briefs"
        :key="brief.id"
        :to="'/documents/' + brief.id"
        class="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <UiCard class="h-full transition-colors group-hover:border-primary/40">
          <UiCardHeader>
            <UiCardTitle as="h2" class="flex items-center gap-3">
              <UiFancyIcon theme="gradient" size="sm" icon="lucide:file-text" />
              <span class="min-w-0">{{ brief.title }}</span>
            </UiCardTitle>
            <UiCardDescription>
              {{
                state?.campaigns.find((c) => c.id === brief.campaignId)?.name || "Studio document"
              }}
            </UiCardDescription>
            <UiCardAction v-if="brief.favorite">
              <Icon name="lucide:star" class="size-4 fill-primary text-primary" />
              <span class="sr-only">Favorite</span>
            </UiCardAction>
          </UiCardHeader>
          <UiCardFooter class="mt-auto justify-between text-xs text-muted-foreground">
            <span>{{ dateLabel(brief.updatedAt) }}</span>
            <Icon
              name="lucide:arrow-up-right"
              class="size-4 transition-colors group-hover:text-primary"
            />
          </UiCardFooter>
        </UiCard>
      </NuxtLink>
    </div>
    <LaunchpadEmpty v-else title="No documents match yet" icon="lucide:file-text" />
  </div>
</template>
