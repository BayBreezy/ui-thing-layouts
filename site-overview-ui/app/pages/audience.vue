<script setup lang="ts">
  usePageSeo({ title: "Audience" });
  const { current, error } = useReport();
  const { prefs, setFilter } = useReportQuery();
  function toggle(key: "country" | "device", value: string) {
    setFilter(key, (prefs.value?.filters[key] === value ? "" : value) as never);
  }
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Audience"
      description="Who visits: where they are, what they use, and whether they have been before."
    />
    <BeaconFilterBar />
    <BeaconError :message="error" class="mb-4" />
    <div class="grid gap-6 @4xl:grid-cols-2">
      <BeaconRankedList
        title="Countries"
        description="Select a country to filter every report."
        :rows="current?.countries ?? null"
        :limit="12"
        selectable
        :selected="prefs?.filters.country"
        @select="toggle('country', $event)"
      />
      <BeaconShareChart
        title="Devices"
        description="Share of sessions by device type."
        :rows="current?.devices ?? null"
        type="donut"
      />
      <BeaconShareChart
        title="Browsers"
        description="Sessions by browser."
        :rows="current?.browsers ?? null"
        type="bar"
      />
      <BeaconShareChart
        title="New and returning"
        description="Whether the visitor had been to the site before."
        :rows="current?.visitorTypes ?? null"
        type="donut"
      />
    </div>
  </div>
</template>
