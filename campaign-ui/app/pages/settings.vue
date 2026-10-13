<script setup lang="ts">
  usePageSeo({ title: "Workspace settings" });
  const { state } = useDemo();
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Make yourself at home."
      description="Your profile, your preferences, and a workspace that feels like yours."
    />
    <LaunchpadRecordGate :exists="!!state" back="/"
      ><LaunchpadSettingsEditor
    /></LaunchpadRecordGate>
  </div>
</template>
