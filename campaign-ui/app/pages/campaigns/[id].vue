<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  const { state, saveCampaign, duplicateCampaign } = useDemo();
  const route = useRoute();
  const campaign = computed(() => state.value?.campaigns.find((c) => c.id === route.params.id));
  usePageSeo({ title: () => campaign.value?.name ?? "Campaign details" });
  const tab = ref("Overview");
  const sections = ["Overview", "Results", "Leads", "Documents", "Activity"];
  const campaignLeads = computed(
    () => state.value?.leads.filter((l) => l.campaignId === campaign.value?.id) ?? []
  );
  const campaignDocuments = computed(
    () => state.value?.documents.filter((d) => d.campaignId === campaign.value?.id) ?? []
  );
  const campaignActivity = computed(
    () => state.value?.activity.filter((a) => a.campaignId === campaign.value?.id) ?? []
  );
  const editor = ref<{ dirty: boolean; pending: boolean }>();
  function selectTab(name: string) {
    if (name === tab.value) return;
    if (
      editor.value?.dirty &&
      !window.confirm("You have unsaved changes. Switch sections and discard them?")
    )
      return;
    tab.value = name;
  }
  const { pending, error, run } = useAction();
  async function archive() {
    if (
      !campaign.value ||
      !window.confirm(
        (campaign.value.archived ? "Restore" : "Archive") +
          " this campaign? Any unsaved edits will be discarded."
      )
    )
      return;
    await run(() =>
      saveCampaign({ ...clone(campaign.value!), archived: !campaign.value!.archived })
    );
  }
  async function duplicate() {
    const result = await run(() => duplicateCampaign(campaign.value!));
    if (result) await navigateTo("/campaigns/" + result.id);
  }
</script>
<template>
  <div class="page-shell">
    <LaunchpadRecordGate :exists="!!campaign" back="/campaigns">
      <template v-if="campaign">
        <LaunchpadPageHeader :title="campaign.name" :description="campaign.objective">
          <UiBadge variant="soft" :color="campaign.archived ? 'gray' : 'violet'">
            {{ campaign.channel }} · {{ campaign.status }}
          </UiBadge>
          <UiButton
            variant="outline"
            :loading="pending"
            :disabled="editor?.pending"
            @click="duplicate"
          >
            <Icon name="lucide:copy" />Duplicate
          </UiButton>
          <UiButton variant="outline" :disabled="pending || editor?.pending" @click="archive">
            <Icon :name="campaign.archived ? 'lucide:archive-restore' : 'lucide:archive'" />{{
              campaign.archived ? "Restore campaign" : "Archive campaign"
            }}
          </UiButton>
        </LaunchpadPageHeader>
        <UiAlert
          v-if="campaign.archived"
          icon="lucide:archive"
          description="This campaign is archived. Historical results and linked records are retained."
          class="mb-6"
        />
        <LaunchpadError :message="error" class="mb-6" />
        <UiTabs :model-value="tab" @update:model-value="selectTab(String($event))">
          <UiTabsList class="mb-2 max-w-full justify-start overflow-x-auto">
            <UiTabsTrigger
              v-for="name in sections"
              :key="name"
              :value="name"
              :disabled="pending || editor?.pending"
              >{{ name }}</UiTabsTrigger
            >
          </UiTabsList>
          <UiTabsContent value="Overview">
            <LaunchpadCampaignEditor ref="editor" :key="campaign.updatedAt" :record="campaign" />
          </UiTabsContent>
          <UiTabsContent value="Results">
            <LaunchpadResults :campaign-id="campaign.id" />
          </UiTabsContent>
          <UiTabsContent value="Leads" class="space-y-4">
            <div>
              <UiButton :to="'/leads/new?campaign=' + campaign.id" variant="outline">
                <Icon name="lucide:plus" />Add a lead
              </UiButton>
            </div>
            <UiCard v-if="campaignLeads.length" class="gap-0 divide-y overflow-hidden py-0">
              <NuxtLink
                v-for="lead in campaignLeads"
                :key="lead.id"
                :to="'/leads/' + lead.id"
                class="flex items-center justify-between gap-4 p-4 text-sm transition-colors hover:bg-muted/50"
              >
                <span class="font-medium">{{ lead.name }} · {{ lead.company }}</span>
                <UiBadge variant="secondary">{{ lead.stage }}</UiBadge>
              </NuxtLink>
            </UiCard>
            <LaunchpadEmpty v-else title="No linked leads yet" icon="lucide:contact-round" />
          </UiTabsContent>
          <UiTabsContent value="Documents" class="space-y-4">
            <div>
              <UiButton :to="'/documents/new?campaign=' + campaign.id" variant="outline">
                <Icon name="lucide:plus" />Create a brief
              </UiButton>
            </div>
            <UiCard v-if="campaignDocuments.length" class="gap-0 divide-y overflow-hidden py-0">
              <NuxtLink
                v-for="brief in campaignDocuments"
                :key="brief.id"
                :to="'/documents/' + brief.id"
                class="flex items-center gap-3 p-4 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <Icon name="lucide:file-text" class="size-4 text-muted-foreground" />{{
                  brief.title
                }}
              </NuxtLink>
            </UiCard>
            <LaunchpadEmpty v-else title="No linked documents yet" icon="lucide:file-text" />
          </UiTabsContent>
          <UiTabsContent value="Activity">
            <UiCard v-if="campaignActivity.length" class="gap-0 divide-y overflow-hidden py-0">
              <NuxtLink
                v-for="item in campaignActivity"
                :key="item.id"
                :to="item.href"
                class="block space-y-1 p-4 transition-colors hover:bg-muted/50"
              >
                <span class="block text-sm">{{ item.title }}</span>
                <span class="block text-xs text-muted-foreground">{{
                  dateLabel(item.createdAt)
                }}</span>
              </NuxtLink>
            </UiCard>
            <LaunchpadEmpty v-else title="No activity yet" icon="lucide:activity" />
          </UiTabsContent>
        </UiTabs>
      </template>
    </LaunchpadRecordGate>
  </div>
</template>
