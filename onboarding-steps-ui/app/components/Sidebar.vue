<template>
  <div
    class="relative flex grow flex-col items-center overflow-hidden rounded-md bg-muted p-6 @[1100px]/main:items-start dark:bg-muted/40"
  >
    <div class="flex items-center gap-3">
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <img src="/logo.jpg" alt="Logo" class="h-10 rounded-md" />
      <h1 class="hidden text-xl font-bold @[1100px]/main:inline-block">ACME Co</h1>
    </div>
    <UiTimeline v-model="currentStep" class="mt-12">
      <UiTimelineItem
        v-for="item in items"
        :key="item.id"
        :step="item.id"
        class="group-data-[orientation=vertical]/timeline:ms-12 group-data-[orientation=vertical]/timeline:[&:not(:last-child)]:pb-16 @[1100px]/main:group-data-[orientation=vertical]/timeline:[&:not(:last-child)]:pb-10"
      >
        <UiTimelineHeader>
          <UiTimelineSeparator
            class="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-[1.625rem]"
          />
          <UiTimelineTitle
            class="mt-0.5 hidden font-semibold text-muted-foreground/80 group-data-[completed=true]/timeline-item:text-foreground @[1100px]/main:inline-block"
            >{{ item.title }}</UiTimelineTitle
          >
          <UiTimelineIndicator
            class="flex size-9 items-center justify-center rounded-md border bg-background shadow-sm group-data-[orientation=vertical]/timeline:-left-7 group-data-[completed=true]/timeline-item:bg-primary group-data-[completed=true]/timeline-item:text-primary-foreground group-data-[completed=true]/timeline-item:[box-shadow:inset_0_1.5px_0_theme(colors.primary.foreground/15%)]"
          >
            <Icon
              :name="item.icon"
              class="size-4 text-muted-foreground/65 group-data-[completed=true]/timeline-item:text-primary-foreground"
            />
          </UiTimelineIndicator>
        </UiTimelineHeader>
        <UiTimelineContent
          class="hidden text-muted-foreground/50 group-data-[completed=true]/timeline-item:text-muted-foreground @[1100px]/main:inline-block"
        >
          {{ item.description }}
        </UiTimelineContent>
      </UiTimelineItem>
    </UiTimeline>
    <img
      src="/logo.jpg"
      alt="Logo"
      class="absolute -bottom-3 -right-5 hidden size-[300px] shrink-0 -rotate-12 rounded-xl opacity-5 @[1100px]/main:block"
    />
    <div class="mt-auto">
      <UiButton
        size="icon"
        variant="outline"
        class="shrink-0 bg-transparent"
        @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'"
      >
        <Icon name="i:sun" class="size-4 text-muted-foreground" />
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const { steps: items, currentStep } = useTimeline();
</script>
