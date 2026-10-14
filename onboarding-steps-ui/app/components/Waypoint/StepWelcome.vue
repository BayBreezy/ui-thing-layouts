<script setup lang="ts">
  const { progress, restart } = useOnboarding();
  const next = [
    {
      icon: "lucide:folder-plus",
      title: "Create your first project",
      hint: "Start from a template or a blank page.",
    },
    {
      icon: "lucide:plug",
      title: "Connect a data source",
      hint: "Bring in the tools your team already uses.",
    },
    {
      icon: "lucide:bell-ring",
      title: "Choose your notifications",
      hint: "Decide what is worth an email.",
    },
  ];
</script>
<template>
  <WaypointStep>
    <WaypointHeading
      title="Welcome to Waypoint"
      :description="
        progress.invited.length
          ? `You're set up, and ${progress.invited.length} ${progress.invited.length === 1 ? 'teammate has' : 'teammates have'} been invited`
          : 'You\'re set up and ready to go'
      "
    />
    <ul class="grid w-full gap-3" aria-label="Suggested next steps">
      <li
        v-for="item in next"
        :key="item.title"
        class="flex items-start gap-3 rounded-lg border bg-card p-4"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Icon :name="item.icon" class="size-4" />
        </span>
        <span>
          <span class="block text-sm font-medium">{{ item.title }}</span>
          <span class="block text-sm text-muted-foreground">{{ item.hint }}</span>
        </span>
      </li>
    </ul>
    <div class="grid w-full gap-3">
      <UiButton
        class="w-full"
        @click="
          useSonner.info('That is the end of the demo', {
            description: 'Thanks for walking through it.',
          })
        "
      >
        Go to my workspace
      </UiButton>
      <UiButton variant="ghost" class="w-full" @click="restart()">Start over</UiButton>
    </div>
  </WaypointStep>
</template>
