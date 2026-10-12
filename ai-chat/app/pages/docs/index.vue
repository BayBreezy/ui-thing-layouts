<script setup lang="ts">
  usePageSeo({
    title: "Documentation",
    description:
      "Guides for chat, assistants, and audio, plus the architecture behind Orbit, from a first conversation to the Nitro routes.",
  });
  const query = ref("");
  const results = computed(() =>
    docs.filter((item) =>
      `${item.title} ${item.description} ${item.category}`
        .toLowerCase()
        .includes(query.value.toLowerCase())
    )
  );
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="A little guidance goes a long way"
      description="From your first conversation to the architecture underneath."
    />
    <UiInput
      v-model="query"
      aria-label="Search documentation"
      placeholder="Find a guide…"
      class="mb-6 max-w-md"
    />
    <div v-if="results.length" class="grid gap-4 md:grid-cols-2">
      <UiCard
        v-for="doc in results"
        :key="doc.slug"
        as-child
        class="transition-colors hover:bg-accent"
      >
        <NuxtLink :to="`/docs/${doc.slug}`">
          <UiCardHeader>
            <UiCardTitle as="h2" class="flex items-center gap-3">
              <UiFancyIcon theme="gradient" size="sm" :icon="doc.icon" />
              {{ doc.title }}
            </UiCardTitle>
            <UiCardDescription>{{ doc.description }}</UiCardDescription>
            <UiCardAction>
              <UiBadge variant="secondary">{{ doc.category }}</UiBadge>
            </UiCardAction>
          </UiCardHeader>
        </NuxtLink>
      </UiCard>
    </div>
    <OrbitEmptyState
      v-else
      title="No guides found"
      description="Try searching for chat, audio, or API."
      icon="lucide:book-open"
    />
  </div>
</template>
