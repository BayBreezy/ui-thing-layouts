<script setup lang="ts">
  import { channels, statuses } from "#shared/types";
  const { state } = useDemo();
  const route = useRoute();
  usePageSeo({ title: "Campaigns" });
  const search = ref("");
  const channel = ref("");
  const status = ref(String(route.query.status || ""));
  const view = ref("board");
  const dots = {
    Draft: "bg-amber-500",
    "In progress": "bg-violet-500",
    Completed: "bg-emerald-500",
  };
  const colors = { Draft: "amber", "In progress": "violet", Completed: "emerald" } as const;
  function clearFilters() {
    search.value = "";
    channel.value = "";
    status.value = "";
  }
  const campaigns = computed(
    () =>
      state.value?.campaigns.filter(
        (c) =>
          !c.archived &&
          (!channel.value || c.channel === channel.value) &&
          (!status.value || c.status === status.value) &&
          (c.name + " " + c.objective).toLowerCase().includes(search.value.toLowerCase())
      ) ?? []
  );
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Good ideas, in motion."
      description="From the first spark to the final result. Give every campaign room to grow."
    >
      <UiButton to="/campaigns/new"><Icon name="lucide:plus" />New campaign</UiButton>
    </LaunchpadPageHeader>
    <UiTabs v-model="view" class="gap-0">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <UiInputGroup class="w-full sm:w-72">
          <UiInputGroupAddon><Icon name="lucide:search" /></UiInputGroupAddon>
          <UiInputGroupInput
            v-model="search"
            aria-label="Search campaigns"
            placeholder="Search campaigns…"
          />
        </UiInputGroup>
        <div class="w-full sm:w-44">
          <UiNativeSelect v-model="channel" aria-label="Campaign channel">
            <option value="">All channels</option>
            <option v-for="item in channels" :key="item">{{ item }}</option>
          </UiNativeSelect>
        </div>
        <div class="w-full sm:w-44">
          <UiNativeSelect v-model="status" aria-label="Campaign status">
            <option value="">All statuses</option>
            <option v-for="item in statuses" :key="item">{{ item }}</option>
          </UiNativeSelect>
        </div>
        <UiTabsList class="sm:ml-auto">
          <UiTabsTrigger value="board"><Icon name="lucide:columns-3" />Board</UiTabsTrigger>
          <UiTabsTrigger value="list"><Icon name="lucide:list" />List</UiTabsTrigger>
        </UiTabsList>
      </div>
      <UiTabsContent value="board">
        <LaunchpadEmpty v-if="!campaigns.length" title="No campaigns match yet">
          <UiButton variant="outline" @click="clearFilters">Clear filters</UiButton>
        </LaunchpadEmpty>
        <div v-else class="grid gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3">
          <section v-for="column in statuses" :key="column" class="space-y-4">
            <div class="flex items-center gap-2">
              <span :class="['size-2 rounded-full', dots[column]]" />
              <h2 class="text-sm font-medium">{{ column }}</h2>
              <UiBadge variant="secondary">{{
                campaigns.filter((c) => c.status === column).length
              }}</UiBadge>
            </div>
            <div class="space-y-4">
              <LaunchpadCampaignCard
                v-for="campaign in campaigns.filter((c) => c.status === column)"
                :key="campaign.id"
                :campaign="campaign"
              />
              <p
                v-if="!campaigns.some((c) => c.status === column)"
                class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
              >
                Room for your next campaign.
              </p>
            </div>
          </section>
        </div>
      </UiTabsContent>
      <UiTabsContent value="list">
        <LaunchpadEmpty v-if="!campaigns.length" title="No campaigns match yet">
          <UiButton variant="outline" @click="clearFilters">Clear filters</UiButton>
        </LaunchpadEmpty>
        <UiCard v-else class="py-2">
          <UiCardContent class="px-2">
            <UiTable>
              <UiTableCaption class="sr-only">Campaign list</UiTableCaption>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Campaign</UiTableHead>
                  <UiTableHead>Channel</UiTableHead>
                  <UiTableHead>Status</UiTableHead>
                  <UiTableHead>Budget</UiTableHead>
                  <UiTableHead>Owner</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <UiTableRow v-for="campaign in campaigns" :key="campaign.id">
                  <UiTableCell>
                    <NuxtLink
                      :to="'/campaigns/' + campaign.id"
                      class="font-medium text-primary underline-offset-4 hover:underline"
                      >{{ campaign.name }}</NuxtLink
                    >
                  </UiTableCell>
                  <UiTableCell>{{ campaign.channel }}</UiTableCell>
                  <UiTableCell>
                    <UiBadge variant="soft" :color="colors[campaign.status]">{{
                      campaign.status
                    }}</UiBadge>
                  </UiTableCell>
                  <UiTableCell>{{ money(campaign.budget) }}</UiTableCell>
                  <UiTableCell>{{
                    state?.members.find((m) => m.id === campaign.ownerId)?.name
                  }}</UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>
          </UiCardContent>
        </UiCard>
      </UiTabsContent>
    </UiTabs>
  </div>
</template>
