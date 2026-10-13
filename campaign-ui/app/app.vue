<script setup lang="ts">
  const { state, ready } = useDemo();
  const { data, error, refresh } = await useAsyncData("launchpad-bootstrap", () =>
    $fetch("/api/demo/bootstrap")
  );
  if (!state.value && data.value) state.value = data.value;
  watch(data, (value) => {
    if (value && !state.value) state.value = value;
  });
  usePageSeo({ title: "A little momentum for your next big idea" });
</script>
<template>
  <UiTooltipProvider :delay-duration="200">
    <NuxtLoadingIndicator color="var(--primary)" />
    <NuxtAnnouncer />
    <div v-if="error && !state" class="flex min-h-screen items-center justify-center p-6">
      <UiCard class="max-w-md text-center">
        <UiCardHeader>
          <LaunchpadLogo class="mx-auto mb-4" />
          <UiCardTitle as="h1" class="text-xl">Let's try that again</UiCardTitle>
          <UiCardDescription>
            We couldn't load your workspace. Check your connection and retry.
          </UiCardDescription>
        </UiCardHeader>
        <UiCardFooter class="justify-center">
          <UiButton @click="refresh()">Retry loading workspace</UiButton>
        </UiCardFooter>
      </UiCard>
    </div>
    <div v-else :data-demo-ready="ready" class="contents">
      <NuxtLayout><NuxtPage /></NuxtLayout>
    </div>
    <UiSonner position="bottom-right" />
  </UiTooltipProvider>
</template>
