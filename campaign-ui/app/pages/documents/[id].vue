<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  const route = useRoute();
  const { state } = useDemo();
  const brief = computed(() => state.value?.documents.find((d) => d.id === route.params.id));
  usePageSeo({ title: () => brief.value?.title ?? "Campaign document" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadRecordGate :exists="!!brief" back="/documents">
      <template v-if="brief">
        <LaunchpadPageHeader
          :title="brief.title"
          description="Edit the document, preview the Markdown, or export a copy."
        >
          <UiButton
            v-if="brief.campaignId"
            :to="'/campaigns/' + brief.campaignId"
            variant="outline"
          >
            View campaign
          </UiButton>
        </LaunchpadPageHeader>
        <LaunchpadBriefEditor :record="brief" />
      </template>
    </LaunchpadRecordGate>
  </div>
</template>
