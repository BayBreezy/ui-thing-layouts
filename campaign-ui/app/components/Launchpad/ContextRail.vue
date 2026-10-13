<script setup lang="ts">
  const { state } = useDemo();
  const recent = computed(() =>
    [...(state.value?.documents ?? [])]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
  );
</script>
<template>
  <div class="space-y-8">
    <section aria-labelledby="rail-documents">
      <div class="mb-3 flex items-center justify-between">
        <h2 id="rail-documents" class="text-sm font-medium">Recent documents</h2>
        <UiButton to="/documents" variant="ghost" size="icon-xs" aria-label="View all documents">
          <Icon name="lucide:arrow-up-right" />
        </UiButton>
      </div>
      <ul class="-mx-2 space-y-1">
        <li v-for="brief in recent" :key="brief.id">
          <NuxtLink
            :to="'/documents/' + brief.id"
            class="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
          >
            <UiFancyIcon
              theme="modern"
              size="sm"
              icon="lucide:file-text"
              class="size-8 rounded-md"
            />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ brief.title }}</span>
              <span class="block text-xs text-muted-foreground">{{
                dateLabel(brief.updatedAt)
              }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section aria-labelledby="rail-team">
      <div class="mb-3 flex items-center justify-between">
        <h2 id="rail-team" class="text-sm font-medium">Your team</h2>
        <UiButton to="/team" variant="ghost" size="icon-xs" aria-label="View the team">
          <Icon name="lucide:arrow-up-right" />
        </UiButton>
      </div>
      <ul class="-mx-2 space-y-1">
        <li v-for="member in state?.members.slice(0, 4)" :key="member.id">
          <NuxtLink
            :to="'/team/' + member.id"
            class="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
          >
            <LaunchpadAvatar :member="member" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ member.name }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{ member.role }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
    <UiCard class="gap-3 py-4">
      <UiCardHeader class="gap-1 px-4">
        <UiFancyIcon theme="gradient" size="sm" icon="lucide:sparkles" class="mb-2" />
        <UiCardTitle as="h2" class="text-sm">A little space to explore.</UiCardTitle>
        <UiCardDescription>
          This is your demo workspace. Make it yours; your changes stay in this browser.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardFooter class="px-4">
        <UiButton to="/docs/onboarding" variant="link" class="h-auto p-0">
          Take a quick tour<Icon name="lucide:arrow-right" />
        </UiButton>
      </UiCardFooter>
    </UiCard>
    <p class="text-xs text-muted-foreground">
      Built with care by
      <a href="https://behonbaker.com" class="text-primary underline underline-offset-2"
        >Behon Baker</a
      >
    </p>
  </div>
</template>
