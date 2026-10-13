<script setup lang="ts">
  definePageMeta({ key: (route) => route.fullPath });
  import { guides } from "~/utils/docs";
  const route = useRoute();
  const guide = guides.find((g) => g.slug === route.params.slug);
  if (!guide) throw createError({ statusCode: 404, statusMessage: "Guide not found" });
  usePageSeo({ title: guide.title, description: guide.description });
</script>
<template>
  <div class="page-shell max-w-4xl">
    <LaunchpadPageHeader :title="guide.title" :description="guide.description">
      <UiButton to="/docs" variant="outline"><Icon name="lucide:arrow-left" />All guides</UiButton>
    </LaunchpadPageHeader>
    <UiCard>
      <UiCardContent><MDC :value="guide.content" class="launchpad-prose" /></UiCardContent>
    </UiCard>
  </div>
</template>
