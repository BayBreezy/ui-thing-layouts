<script setup lang="ts">
  import type { Campaign } from "#shared/types";
  usePageSeo({ title: "New campaign" });
  const record = newCampaign();
  async function saved(value: Campaign) {
    await navigateTo("/campaigns/" + value.id);
  }
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Make room for your next idea."
      description="Start with a clear goal. The rest will follow."
    />
    <LaunchpadRecordGate :exists="true" back="/campaigns">
      <LaunchpadCampaignEditor :record="record" @saved="saved" />
    </LaunchpadRecordGate>
  </div>
</template>
