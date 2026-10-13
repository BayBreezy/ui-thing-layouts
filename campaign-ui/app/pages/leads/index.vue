<script setup lang="ts">
  import { stages } from "#shared/types";
  const { state } = useDemo();
  usePageSeo({ title: "Leads" });
  const search = ref("");
  const stage = ref("");
  const campaign = ref("");
  const page = ref(1);
  const size = 10;
  const filtered = computed(
    () =>
      state.value?.leads.filter(
        (l) =>
          (!stage.value || l.stage === stage.value) &&
          (!campaign.value || l.campaignId === campaign.value) &&
          (l.name + " " + l.email + " " + l.company)
            .toLowerCase()
            .includes(search.value.toLowerCase())
      ) ?? []
  );
  const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / size)));
  const leads = computed(() => filtered.value.slice((page.value - 1) * size, page.value * size));
  watch([search, stage, campaign], () => {
    page.value = 1;
  });
  watch(pages, (count) => {
    page.value = Math.min(page.value, count);
  });
  function exportLeads() {
    downloadFile(
      "launchpad-leads.csv",
      csv([
        ["Name", "Email", "Company", "Stage", "Potential value (USD)", "Campaign"],
        ...filtered.value.map((l) => [
          l.name,
          l.email,
          l.company,
          l.stage,
          l.value,
          state.value?.campaigns.find((c) => c.id === l.campaignId)?.name || "",
        ]),
      ]),
      "text/csv"
    );
  }
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="The start of something good."
      description="Real conversations begin with a little understanding. Keep your leads close."
    >
      <UiButton variant="outline" @click="exportLeads">
        <Icon name="lucide:download" />Export CSV
      </UiButton>
      <UiButton to="/leads/new"><Icon name="lucide:plus" />Add lead</UiButton>
    </LaunchpadPageHeader>
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <UiInputGroup class="w-full sm:w-72">
        <UiInputGroupAddon><Icon name="lucide:search" /></UiInputGroupAddon>
        <UiInputGroupInput
          v-model="search"
          aria-label="Search leads"
          placeholder="Search people or companies…"
        />
      </UiInputGroup>
      <div class="w-full sm:w-44">
        <UiNativeSelect v-model="stage" aria-label="Lead stage">
          <option value="">All stages</option>
          <option v-for="item in stages" :key="item">{{ item }}</option>
        </UiNativeSelect>
      </div>
      <div class="w-full sm:w-56">
        <UiNativeSelect v-model="campaign" aria-label="Lead campaign">
          <option value="">All campaigns</option>
          <option v-for="item in state?.campaigns" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </UiNativeSelect>
      </div>
    </div>
    <UiCard v-if="leads.length" class="py-2">
      <UiCardContent class="px-2">
        <UiTable>
          <UiTableCaption class="sr-only">Lead pipeline</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Contact</UiTableHead>
              <UiTableHead>Company</UiTableHead>
              <UiTableHead>Stage</UiTableHead>
              <UiTableHead>Value</UiTableHead>
              <UiTableHead>Owner</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="lead in leads" :key="lead.id">
              <UiTableCell>
                <NuxtLink
                  :to="'/leads/' + lead.id"
                  class="font-medium text-primary underline-offset-4 hover:underline"
                  >{{ lead.name }}</NuxtLink
                >
                <p class="text-xs text-muted-foreground">{{ lead.email }}</p>
              </UiTableCell>
              <UiTableCell>{{ lead.company }}</UiTableCell>
              <UiTableCell>
                <UiBadge variant="secondary">{{ lead.stage }}</UiBadge>
              </UiTableCell>
              <UiTableCell>{{ money(lead.value) }}</UiTableCell>
              <UiTableCell>{{
                state?.members.find((m) => m.id === lead.ownerId)?.name
              }}</UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
    <LaunchpadEmpty v-else title="No leads match these filters" icon="lucide:contact-round" />
    <div class="mt-4 flex items-center justify-between gap-4">
      <p class="text-sm text-muted-foreground">
        {{ filtered.length }} leads · Page {{ page }} of {{ pages }}
      </p>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" :disabled="page <= 1" @click="page--">
          Previous
        </UiButton>
        <UiButton variant="outline" size="sm" :disabled="page >= pages" @click="page++">
          Next
        </UiButton>
      </div>
    </div>
  </div>
</template>
