<script setup lang="ts">
  const route = useRoute();
  const doc = computed(() => docs.find((item) => item.slug === route.params.slug));
  if (!doc.value) throw createError({ statusCode: 404, statusMessage: "Guide not found" });
  usePageSeo({ title: () => doc.value?.title, description: () => doc.value?.description });
</script>
<template>
  <div v-if="doc" class="page-shell">
    <UiButton to="/docs" variant="ghost" size="sm" class="mb-4">
      <Icon name="lucide:arrow-left" />All guides
    </UiButton>
    <OrbitPageHeader :title="doc.title" :description="doc.description">
      <UiBadge variant="secondary">{{ doc.category }}</UiBadge>
    </OrbitPageHeader>
    <div class="grid items-start gap-6 lg:grid-cols-[1fr_16rem]">
      <UiCard class="min-w-0">
        <UiCardContent>
          <OrbitMarkdown :value="doc.body" />
        </UiCardContent>
      </UiCard>
      <nav aria-label="Documentation guides" class="space-y-1 lg:sticky lg:top-6">
        <p class="mb-2 px-3 text-sm font-medium">Explore more</p>
        <UiButton
          v-for="item in docs"
          :key="item.slug"
          :to="`/docs/${item.slug}`"
          :variant="doc.slug === item.slug ? 'secondary' : 'ghost'"
          class="w-full justify-start"
          >{{ item.title }}</UiButton
        >
      </nav>
    </div>
  </div>
</template>
