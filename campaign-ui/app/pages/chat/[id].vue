<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  const route = useRoute();
  const { state, ready, markThreadRead } = useDemo();
  const thread = computed(() => state.value?.threads.find((t) => t.id === route.params.id));
  usePageSeo({ title: () => thread.value?.title ?? "Team conversation" });
  watch(
    [ready, () => thread.value?.id],
    ([restored, id]) => {
      if (restored && id) markThreadRead(id);
    },
    { immediate: true }
  );
</script>
<template>
  <div class="page-shell">
    <LaunchpadRecordGate :exists="!!thread" back="/chat">
      <template v-if="thread">
        <LaunchpadPageHeader
          :title="thread.title"
          description="A little collaboration goes a long way."
        >
          <UiButton to="/chat" variant="outline">All conversations</UiButton>
          <UiButton :to="'/campaigns/' + thread.campaignId" variant="outline">
            View campaign
          </UiButton>
        </LaunchpadPageHeader>
        <LaunchpadConversation :thread="thread" />
      </template>
    </LaunchpadRecordGate>
  </div>
</template>
