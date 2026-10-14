<script setup lang="ts">
  import type { NuxtError } from "#app";
  const props = defineProps<{ error: NuxtError }>();
  usePageSeo({
    title: () => (props.error.statusCode === 404 ? "Page not found" : "Something went wrong"),
    canonical: false,
  });
</script>
<template>
  <main class="flex min-h-svh items-center justify-center p-6">
    <div class="max-w-lg text-center">
      <BeaconLogo class="mb-10 justify-center" />
      <p class="mb-4 font-mono text-sm text-primary">{{ error.statusCode }}</p>
      <h1 class="text-3xl font-semibold tracking-tight">
        {{
          error.statusCode === 404 ? "We couldn't find that page." : "That request lost its signal."
        }}
      </h1>
      <p class="mt-4 mb-8 text-sm text-muted-foreground">
        {{
          error.statusCode === 404
            ? "The link may be old, or the page may have moved. Let's get you back to the overview."
            : "Something interrupted the report. Your local settings are still here. Return to the overview and try again."
        }}
      </p>
      <UiButton @click="clearError({ redirect: '/' })">
        Back to Beacon <Icon name="lucide:arrow-up-right" />
      </UiButton>
      <p class="mt-12 text-xs text-muted-foreground">
        Beacon · Designed & built by
        <NuxtLink
          class="text-primary underline underline-offset-2"
          external
          href="https://behonbaker.com"
          >Behon Baker</NuxtLink
        >
      </p>
    </div>
  </main>
</template>
