<script setup lang="ts">
  import type { DemoState } from "#shared/types";
  const { state, ready } = useDemo();
  const failed = useState("mendly-bootstrap-failed", () => false);
  // The seed is fetched once on the server and travels to the browser inside `state`, so it is not
  // serialized twice into the page payload.
  async function load() {
    try {
      state.value = await $fetch<DemoState>("/api/demo/bootstrap");
      failed.value = false;
    } catch {
      failed.value = true;
    }
  }
  await callOnce("mendly-bootstrap", load);
  usePageSeo({ title: "Appointments without the back-and-forth" });
</script>
<template>
  <UiTooltipProvider :delay-duration="200">
    <NuxtLoadingIndicator color="var(--primary)" />
    <NuxtAnnouncer />
    <div v-if="failed && !state" class="flex min-h-screen items-center justify-center p-6">
      <UiCard class="max-w-md text-center">
        <UiCardHeader>
          <MendlyLogo class="mx-auto mb-4" />
          <UiCardTitle as="h1" class="text-xl">Let's try that again</UiCardTitle>
          <UiCardDescription>
            We couldn't load the schedule. Check your connection and retry.
          </UiCardDescription>
        </UiCardHeader>
        <UiCardFooter class="justify-center">
          <UiButton @click="load()">Retry loading the schedule</UiButton>
        </UiCardFooter>
      </UiCard>
    </div>
    <div v-else :data-demo-ready="ready" class="contents">
      <NuxtLayout><NuxtPage /></NuxtLayout>
    </div>
    <UiSonner position="bottom-right" />
  </UiTooltipProvider>
</template>
