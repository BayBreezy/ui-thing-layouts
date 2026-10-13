<script setup lang="ts">
  import { progress } from "#shared/demo";
  import type { Campaign } from "#shared/types";
  defineProps<{ campaign: Campaign }>();
  const { state } = useDemo();
  const icons = {
    Email: "lucide:mail",
    Social: "lucide:instagram",
    Search: "lucide:search",
    Events: "lucide:calendar-days",
  };
</script>
<template>
  <NuxtLink
    :to="'/campaigns/' + campaign.id"
    class="group block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
  >
    <UiCard class="h-full gap-4 transition-colors group-hover:border-primary/40">
      <UiCardHeader>
        <UiCardTitle as="h3" class="flex items-center gap-3 text-sm leading-6">
          <UiFancyIcon theme="gradient" size="sm" :icon="icons[campaign.channel]" />
          <span class="min-w-0">{{ campaign.name }}</span>
        </UiCardTitle>
        <UiCardDescription>
          {{ campaign.channel }} ·
          {{ campaign.startDate ? dateLabel(campaign.startDate) : "Not scheduled yet" }}
        </UiCardDescription>
        <UiCardAction>
          <UiAvatarGroup class="-space-x-1">
            <LaunchpadAvatar
              v-for="id in campaign.memberIds.slice(0, 3)"
              :key="id"
              :member="state?.members.find((m) => m.id === id)"
              size="sm"
            />
          </UiAvatarGroup>
        </UiCardAction>
      </UiCardHeader>
      <UiCardContent class="space-y-2">
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Checklist progress</span><span>{{ progress(campaign) }}%</span>
        </div>
        <UiProgress
          :model-value="progress(campaign)"
          :aria-label="`${campaign.name} checklist progress`"
        />
      </UiCardContent>
      <UiCardFooter class="justify-between border-t text-xs text-muted-foreground [.border-t]:pt-4">
        <span>{{ money(campaign.budget) }} budget</span>
        <Icon
          name="lucide:arrow-up-right"
          class="size-4 transition-colors group-hover:text-primary"
        />
      </UiCardFooter>
    </UiCard>
  </NuxtLink>
</template>
