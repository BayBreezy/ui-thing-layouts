<script setup lang="ts">
  const { state } = useDemo();
  usePageSeo({ title: "A little momentum for your next big idea" });
  const active = computed(() => state.value?.campaigns.filter((c) => !c.archived) ?? []);
  const highlights = computed(() => [
    {
      label: "Active campaigns",
      to: "/campaigns",
      value: active.value.filter((c) => c.status === "In progress").length,
    },
    { label: "Open lead pipeline", to: "/leads", value: money(pipeline.value) },
    {
      label: "Ideas ready to grow",
      to: "/campaigns?status=Draft",
      value: active.value.filter((c) => c.status === "Draft").length,
    },
  ]);
  const pipeline = computed(
    () =>
      state.value?.leads
        .filter((l) => l.stage !== "Won" && l.stage !== "Lost")
        .reduce((sum, l) => sum + l.value, 0) ?? 0
  );
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Good ideas start here."
      description="A little clarity, a little momentum. Here's how your campaigns are doing."
    >
      <UiButton to="/campaigns/new"><Icon name="lucide:plus" />New campaign</UiButton>
    </LaunchpadPageHeader>
    <LaunchpadResults />
    <div class="mt-6 grid gap-4 @xl:grid-cols-3">
      <NuxtLink
        v-for="item in highlights"
        :key="item.label"
        :to="item.to"
        class="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <UiCard class="h-full gap-4 transition-colors group-hover:border-primary/40">
          <UiCardHeader>
            <UiCardDescription>{{ item.label }}</UiCardDescription>
            <UiCardTitle as="p" class="text-2xl tabular-nums">{{ item.value }}</UiCardTitle>
            <UiCardAction>
              <Icon
                name="lucide:arrow-up-right"
                class="size-4 text-muted-foreground transition-colors group-hover:text-primary"
              />
            </UiCardAction>
          </UiCardHeader>
        </UiCard>
      </NuxtLink>
    </div>
    <section class="mt-8">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold tracking-tight">A few campaigns to keep an eye on</h2>
        <UiButton to="/campaigns" variant="link" class="px-0">
          View all<Icon name="lucide:arrow-right" />
        </UiButton>
      </div>
      <div class="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
        <LaunchpadCampaignCard
          v-for="campaign in active.slice(4, 7)"
          :key="campaign.id"
          :campaign="campaign"
        />
      </div>
    </section>
    <UiCard class="mt-8 gap-2">
      <UiCardHeader>
        <UiCardTitle as="h2">Around the studio</UiCardTitle>
        <UiCardDescription>The latest changes from your workspace.</UiCardDescription>
        <UiCardAction>
          <UiButton to="/activity" variant="ghost" size="sm">
            All activity<Icon name="lucide:arrow-right" />
          </UiButton>
        </UiCardAction>
      </UiCardHeader>
      <UiCardContent>
        <ul class="divide-y">
          <li v-for="item in state?.activity.slice(0, 4)" :key="item.id">
            <NuxtLink
              :to="item.href"
              class="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent/50"
            >
              <UiFancyIcon theme="light" size="sm" color="gray" icon="lucide:check" />
              <span class="flex-1 text-sm">{{ item.title }}</span>
              <span class="hidden text-xs text-muted-foreground sm:inline">{{
                dateLabel(item.createdAt)
              }}</span>
            </NuxtLink>
          </li>
        </ul>
      </UiCardContent>
    </UiCard>
  </div>
</template>
