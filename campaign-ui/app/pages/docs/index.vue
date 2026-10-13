<script setup lang="ts">
  import { guides } from "~/utils/docs";
  usePageSeo({ title: "Guides & documentation" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="A thoughtful place to start."
      description="Learn your way around Launchpad, or look under the hood."
    />
    <div class="grid gap-4 @xl:grid-cols-2">
      <NuxtLink
        v-for="guide in guides"
        :key="guide.slug"
        :to="'/docs/' + guide.slug"
        class="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <UiCard class="h-full transition-colors group-hover:border-primary/40">
          <UiCardHeader>
            <UiCardTitle as="h2" class="flex items-center gap-3">
              <UiFancyIcon theme="gradient" size="sm" icon="lucide:book-open" />
              {{ guide.title }}
            </UiCardTitle>
            <UiCardDescription>{{ guide.description }}</UiCardDescription>
          </UiCardHeader>
          <UiCardFooter class="mt-auto text-sm font-medium text-primary">
            Read guide<Icon name="lucide:arrow-right" class="ml-1 size-4" />
          </UiCardFooter>
        </UiCard>
      </NuxtLink>
    </div>
  </div>
</template>
