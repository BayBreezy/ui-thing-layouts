<template>
  <UiCard class="relative">
    <div class="@container">
      <div
        class="flex flex-col gap-4 border-b px-6 py-4 @[500px]:flex-row @[500px]:items-center @[500px]:justify-between"
      >
        <p class="font-semibold">{{ title }}</p>
        <div class="flex items-center gap-2">
          <UiButton size="sm" variant="outline">
            <span>All pages</span>
            <Icon name="i:chevron-down" class="size-4 text-muted-foreground/80" />
          </UiButton>
          <UiButton v-tippy="'View more options'" size="icon-sm" variant="ghost">
            <span class="sr-only">Click to see other options</span>
            <Icon name="i:dots-vertical" class="size-4 text-muted-foreground/80" />
          </UiButton>
        </div>
      </div>
    </div>
    <UiCardContent class="pb-8">
      <slot />
    </UiCardContent>
    <div class="absolute inset-x-0 -bottom-5 flex justify-center">
      <UiButton size="sm" variant="outline">Load more</UiButton>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
  defineProps<{
    title: string;
  }>();
</script>
