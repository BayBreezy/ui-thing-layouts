<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  const { state } = useDemo();
  const route = useRoute();
  const member = computed(() => state.value?.members.find((m) => m.id === route.params.id));
  usePageSeo({ title: () => member.value?.name ?? "Team member" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadRecordGate :exists="!!member" back="/team">
      <template v-if="member">
        <LaunchpadPageHeader :title="member.name" :description="member.role + ' · ' + member.email">
          <UiButton to="/team" variant="outline">View team</UiButton>
        </LaunchpadPageHeader>
        <section class="space-y-4">
          <h2 class="text-lg font-semibold tracking-tight">Assigned campaigns</h2>
          <div class="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
            <LaunchpadCampaignCard
              v-for="campaign in state?.campaigns.filter(
                (c) => !c.archived && (c.ownerId === member!.id || c.memberIds.includes(member!.id))
              )"
              :key="campaign.id"
              :campaign="campaign"
            />
          </div>
        </section>
        <UiCard class="mt-8 gap-2">
          <UiCardHeader>
            <UiCardTitle as="h2">Assigned leads</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <ul class="divide-y">
              <li
                v-for="lead in state?.leads.filter((l) => l.ownerId === member!.id)"
                :key="lead.id"
              >
                <NuxtLink
                  :to="'/leads/' + lead.id"
                  class="-mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-3 text-sm transition-colors hover:bg-accent/50"
                >
                  <span class="font-medium">{{ lead.name }}</span>
                  <UiBadge variant="secondary">{{ lead.stage }}</UiBadge>
                </NuxtLink>
              </li>
            </ul>
          </UiCardContent>
        </UiCard>
      </template>
    </LaunchpadRecordGate>
  </div>
</template>
