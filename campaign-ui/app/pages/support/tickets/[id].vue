<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  const { state } = useDemo();
  const route = useRoute();
  const ticket = computed(() => state.value?.tickets.find((t) => t.id === route.params.id));
  usePageSeo({ title: () => ticket.value?.subject ?? "Support ticket" });
</script>
<template>
  <div class="page-shell max-w-4xl">
    <LaunchpadRecordGate :exists="!!ticket" back="/support">
      <template v-if="ticket">
        <LaunchpadPageHeader
          :title="ticket.subject"
          :description="ticket.category + ' · ' + ticket.status"
        >
          <UiButton to="/support" variant="outline">Support center</UiButton>
        </LaunchpadPageHeader>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Your request</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-6">
            <p class="text-sm leading-6 whitespace-pre-wrap">{{ ticket.description }}</p>
            <UiAlert
              icon="lucide:sparkles"
              icon-class="text-primary"
              title="Simulated support response"
              :description="ticket.response"
            />
          </UiCardContent>
        </UiCard>
      </template>
    </LaunchpadRecordGate>
  </div>
</template>
