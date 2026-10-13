<script setup lang="ts">
  usePageSeo({ title: "Changelog" });
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="A fresh start for Campaign."
      description="From a static layout to a workspace with a little life in it."
    />
    <UiCard>
      <UiCardHeader>
        <div><UiBadge variant="secondary">Launchpad 1.0</UiBadge></div>
        <UiCardTitle as="h2" class="text-xl">The creative studio is open.</UiCardTitle>
        <UiCardDescription>October 12, 2026</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <ul class="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
          <li>Real routes for campaigns, leads, team conversations, documents, and support.</li>
          <li>Connected sample results with charts, tables, filters, and exports.</li>
          <li>Validated stateless APIs and browser-persisted visitor edits.</li>
          <li>
            A violet identity, local typography, responsive navigation, and light/dark themes.
          </li>
          <li>Nuxt 4, Tailwind 4, Reka UI, Bun, Oxfmt, Oxlint, and automated verification.</li>
        </ul>
      </UiCardContent>
      <UiCardFooter>
        <UiButton to="/docs/architecture" variant="outline">Explore the architecture</UiButton>
      </UiCardFooter>
    </UiCard>
  </div>
</template>
