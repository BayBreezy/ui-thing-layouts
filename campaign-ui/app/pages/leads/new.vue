<script setup lang="ts">
  import type { Lead } from "#shared/types";
  usePageSeo({ title: "Add lead" });
  const route = useRoute();
  const record = newLead();
  record.campaignId = String(route.query.campaign || "");
  async function saved(value: Lead) {
    await navigateTo("/leads/" + value.id);
  }
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Make a new connection."
      description="Add the person, the company, and where the conversation stands."
    />
    <LaunchpadRecordGate :exists="true" back="/leads">
      <LaunchpadLeadEditor :record="record" @saved="saved" />
    </LaunchpadRecordGate>
  </div>
</template>
