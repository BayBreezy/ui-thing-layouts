<script setup lang="ts">
  import { rankedCsv } from "#shared/csv";
  import { downloadFile } from "~/utils/demo";

  usePageSeo({ title: "Sources" });
  const { site } = useDemo();
  const { current, error } = useReport();
  const { prefs, setFilter } = useReportQuery();
  function toggle(key: "channel", value: string) {
    setFilter(key, (prefs.value?.filters[key] === value ? "" : value) as never);
  }
  function exportCsv() {
    const report = current.value;
    if (!report) return;
    downloadFile(
      `${site.value?.id ?? "beacon"}-referrers.csv`,
      rankedCsv("Referrer", report.referrers)
    );
    useSonner.success("Referrers exported");
  }
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Sources"
      description="How people found the site: channels, the sites that sent them, and your campaigns."
    >
      <UiButton variant="outline" :disabled="!current?.referrers.length" @click="exportCsv">
        <Icon name="lucide:download" />Export referrers
      </UiButton>
    </BeaconPageHeader>
    <BeaconFilterBar />
    <BeaconError :message="error" class="mb-4" />
    <div class="grid gap-6 @4xl:grid-cols-2">
      <BeaconShareChart
        title="Channel mix"
        description="Share of sessions by channel."
        :rows="current?.channels ?? null"
        type="donut"
      />
      <BeaconRankedList
        title="Channels"
        description="Select a channel to filter every report."
        :rows="current?.channels ?? null"
        selectable
        :selected="prefs?.filters.channel"
        @select="toggle('channel', $event)"
      />
      <BeaconRankedList
        title="Top referrers"
        description="Sites and apps that sent sessions."
        :rows="current?.referrers ?? null"
      />
      <BeaconRankedList
        title="Campaigns"
        description="Sessions tagged with a UTM campaign."
        :rows="current?.campaigns ?? null"
      />
    </div>
  </div>
</template>
