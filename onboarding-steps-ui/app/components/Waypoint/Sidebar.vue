<script setup lang="ts">
  const { steps, currentStep, progress } = useOnboarding();
  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === "dark");
</script>
<template>
  <nav
    aria-label="Onboarding progress"
    class="relative flex h-full flex-col items-center overflow-hidden rounded-xl bg-muted p-6 lg:items-start dark:bg-muted/40"
  >
    <NuxtLink
      to="/"
      aria-label="Waypoint home"
      class="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <WaypointLogo class="[&>span:last-child]:hidden lg:[&>span:last-child]:inline" />
    </NuxtLink>
    <UiTimeline :model-value="currentStep" as="ol" class="mt-12">
      <UiTimelineItem
        v-for="item in steps"
        :key="item.id"
        as="li"
        :aria-hidden="false"
        :aria-current="item.id === currentStep ? 'step' : undefined"
        :step="item.id"
        class="group-data-[orientation=vertical]/timeline:ms-12 group-data-[orientation=vertical]/timeline:not-last:pb-16 lg:group-data-[orientation=vertical]/timeline:not-last:pb-10"
      >
        <UiTimelineHeader>
          <UiTimelineSeparator
            class="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-[1.625rem]"
          />
          <UiTimelineTitle
            class="mt-0.5 hidden font-semibold text-muted-foreground group-data-completed/timeline-item:text-foreground lg:inline-block"
          >
            {{ item.title }}
          </UiTimelineTitle>
          <UiTimelineIndicator
            class="flex size-9 items-center justify-center rounded-lg border bg-background shadow-xs group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground group-data-[orientation=vertical]/timeline:-left-7"
          >
            <Icon :name="item.icon" class="size-4" />
          </UiTimelineIndicator>
        </UiTimelineHeader>
        <UiTimelineContent class="hidden text-muted-foreground lg:inline-block">
          {{ item.description }}
        </UiTimelineContent>
        <span class="sr-only lg:hidden">{{ item.title }}</span>
      </UiTimelineItem>
    </UiTimeline>
    <div class="mt-auto flex w-full flex-col items-center gap-4 lg:items-start">
      <p
        v-if="progress.email"
        class="hidden max-w-full truncate text-sm text-muted-foreground lg:block"
      >
        Signed up as <span class="font-medium text-foreground">{{ progress.email }}</span>
      </p>
      <div class="flex items-center gap-2">
        <ClientOnly>
          <UiButton
            size="icon"
            variant="outline"
            class="bg-transparent"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="colorMode.preference = isDark ? 'light' : 'dark'"
          >
            <Icon
              :name="isDark ? 'lucide:sun' : 'lucide:moon'"
              class="size-4 text-muted-foreground"
            />
          </UiButton>
          <template #fallback>
            <UiButton
              size="icon"
              variant="outline"
              class="bg-transparent"
              aria-label="Switch theme"
              disabled
            >
              <Icon name="lucide:moon" class="size-4 text-muted-foreground" />
            </UiButton>
          </template>
        </ClientOnly>
      </div>
    </div>
  </nav>
</template>
