<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  const route = useRoute();
  const { state } = useDemo();
  const lead = computed(() => state.value?.leads.find((l) => l.id === route.params.id));
  usePageSeo({ title: () => lead.value?.name ?? "Lead details" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadRecordGate :exists="!!lead" back="/leads">
      <template v-if="lead">
        <LaunchpadPageHeader :title="lead.name" :description="lead.company">
          <UiButton to="/leads" variant="outline">All leads</UiButton>
          <UiButton v-if="lead.campaignId" :to="'/campaigns/' + lead.campaignId" variant="outline">
            View campaign
          </UiButton>
        </LaunchpadPageHeader>
        <LaunchpadLeadEditor :record="lead" />
      </template>
    </LaunchpadRecordGate>
  </div>
</template>
