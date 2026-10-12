<script setup lang="ts">
  const route = useRoute();
  const { assistants, ready } = useDemo();
  const isNew = computed(() => route.params.id === "new");
  const assistant = computed(() => assistants.value.find((item) => item.id === route.params.id));
  usePageSeo({
    title: () =>
      isNew.value ? "Create assistant" : `Edit ${assistant.value?.name ?? "assistant"}`,
    description: "Give your specialist a purpose, a voice, and the right tools.",
  });
  definePageMeta({ key: (route) => route.fullPath });
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      :title="isNew ? 'Create an assistant' : 'Make it your own'"
      description="Give your specialist a purpose, a voice, and the right tools."
    /><OrbitAssistantEditor
      v-if="ready && (isNew || assistant)"
      :assistant="assistant"
    /><UiSkeleton v-else-if="!ready" class="h-96 max-w-3xl" /><OrbitEmptyState
      v-else
      title="Assistant not found"
      description="It may have been deleted or belong to another workspace."
      icon="lucide:bot"
      ><UiButton to="/assistants">Back to assistants</UiButton></OrbitEmptyState
    >
  </div>
</template>
