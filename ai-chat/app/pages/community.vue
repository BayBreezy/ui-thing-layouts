<script setup lang="ts">
  usePageSeo({
    title: "Community & resources",
    description:
      "Meet the tools and people behind Orbit, a Nuxt and UI Thing portfolio demo built in the open.",
  });
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="Good ideas grow together"
      description="Meet the tools and people behind this little corner of the web."
    />
    <UiCard class="bg-muted/50">
      <UiCardHeader>
        <UiFancyIcon theme="gradient" size="md" icon="lucide:orbit" class="mb-2" />
        <UiCardTitle as="h2" class="text-xl">Built in the open. Made to explore.</UiCardTitle>
        <UiCardDescription class="max-w-2xl">
          Orbit began as a UI Thing layout. It’s now an interactive workspace demonstrating
          accessible interfaces, full-stack Nuxt architecture, and careful attention to the details
          that make software feel considered.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardFooter>
        <UiButton to="/docs/architecture" variant="outline">
          See how it works <Icon name="lucide:arrow-right" />
        </UiButton>
      </UiCardFooter>
    </UiCard>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <UiCard
        v-for="resource in resources"
        :key="resource.href"
        as="a"
        :href="resource.href"
        target="_blank"
        rel="noopener noreferrer"
        class="group transition-colors hover:bg-accent"
      >
        <UiCardHeader>
          <UiCardTitle as="h2" class="flex items-center gap-3">
            <UiFancyIcon theme="gradient" size="sm" :icon="resource.icon" />
            <span> {{ resource.title }}<span class="sr-only"> (opens in a new tab)</span> </span>
          </UiCardTitle>
          <UiCardDescription>{{ resource.description }}</UiCardDescription>
          <UiCardAction>
            <Icon name="lucide:arrow-up-right" class="size-4 text-muted-foreground" />
          </UiCardAction>
        </UiCardHeader>
      </UiCard>
    </div>
  </div>
</template>
