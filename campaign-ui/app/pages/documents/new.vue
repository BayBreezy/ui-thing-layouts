<script setup lang="ts">
  import type { Brief } from "#shared/types";
  usePageSeo({ title: "New document" });
  const route = useRoute();
  const record = newBrief();
  record.campaignId = String(route.query.campaign || "");
  async function saved(value: Brief) {
    await navigateTo("/documents/" + value.id);
  }
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Start with a blank page."
      description="A brief, a plan, or the first spark of an idea."
    />
    <LaunchpadRecordGate :exists="true" back="/documents">
      <LaunchpadBriefEditor :record="record" @saved="saved" />
    </LaunchpadRecordGate>
  </div>
</template>
