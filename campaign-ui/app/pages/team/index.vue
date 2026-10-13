<script setup lang="ts">
  const { state } = useDemo();
  usePageSeo({ title: "Your team" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Good work happens together."
      description="Meet the creative studio. A small team with plenty of possibility."
    />
    <div class="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
      <NuxtLink
        v-for="member in state?.members"
        :key="member.id"
        :to="'/team/' + member.id"
        class="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <UiCard class="h-full transition-colors group-hover:border-primary/40">
          <UiCardHeader>
            <UiCardTitle as="h2" class="flex items-center gap-3">
              <LaunchpadAvatar :member="member" size="lg" />
              <span class="min-w-0">
                {{ member.name }}
                <span class="block text-sm font-normal text-muted-foreground">{{
                  member.role
                }}</span>
              </span>
            </UiCardTitle>
          </UiCardHeader>
          <UiCardFooter class="mt-auto gap-2">
            <UiBadge variant="secondary">
              {{
                state?.campaigns.filter((c) => !c.archived && c.memberIds.includes(member.id))
                  .length
              }}
              campaigns
            </UiBadge>
            <UiBadge variant="outline">
              {{ state?.leads.filter((l) => l.ownerId === member.id).length }} leads
            </UiBadge>
          </UiCardFooter>
        </UiCard>
      </NuxtLink>
    </div>
  </div>
</template>
