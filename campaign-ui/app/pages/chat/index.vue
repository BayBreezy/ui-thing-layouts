<script setup lang="ts">
  const { state } = useDemo();
  usePageSeo({ title: "Team chat" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="Keep the conversation going."
      description="A shared place for feedback, small wins, and your next good idea."
    />
    <UiCard v-if="state?.threads.length" class="gap-0 divide-y overflow-hidden py-0">
      <NuxtLink
        v-for="thread in state.threads"
        :key="thread.id"
        :to="'/chat/' + thread.id"
        class="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <UiFancyIcon theme="gradient" size="sm" icon="lucide:messages-square" />
        <div class="min-w-0 flex-1 space-y-1">
          <h2 class="flex items-center gap-2 text-sm font-medium">
            <span class="truncate">{{ thread.title }}</span>
            <span v-if="thread.unread" class="size-2 shrink-0 rounded-full bg-primary" />
            <span class="sr-only">{{ thread.unread ? "Unread" : "Read" }}</span>
          </h2>
          <p class="truncate text-sm text-muted-foreground">
            {{ thread.messages.at(-1)?.content }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ state?.campaigns.find((c) => c.id === thread.campaignId)?.name }}
          </p>
        </div>
        <Icon name="lucide:arrow-up-right" class="size-4 shrink-0 text-muted-foreground" />
      </NuxtLink>
    </UiCard>
    <LaunchpadEmpty v-else title="No conversations yet" icon="lucide:messages-square" />
    <p class="mt-6 text-sm text-muted-foreground">
      Messages stay in this browser. Teammate replies are scripted demo responses.
    </p>
  </div>
</template>
