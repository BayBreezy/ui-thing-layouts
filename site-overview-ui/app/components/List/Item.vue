<template>
  <li :aria-label="`${title} with ${sessions} sessions`" class="flex items-start gap-10">
    <div class="flex grow flex-col gap-2">
      <p class="text-sm font-semibold">{{ title }}</p>
      <UiProgress class="h-1.5 *:bg-blue-500" :model-value="progress" />
    </div>
    <div class="flex shrink-0 items-center gap-2 text-sm text-muted-foreground/80">
      <p>{{ sessions }} sessions</p>
      <Icon name="i:chevron-right" class="size-4" />
    </div>
  </li>
</template>

<script lang="ts" setup>
  defineProps<{
    title: string;
    progress: number;
    sessions: number;
  }>();
</script>
