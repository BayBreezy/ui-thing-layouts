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
      <LaunchpadLogo class="mb-10 justify-center" />
      <p class="mb-4 font-mono text-sm text-primary">{{ error.statusCode }}</p>
      <h1 class="text-3xl font-semibold tracking-tight">
        {{
          error.statusCode === 404
            ? "This page has wandered off."
            : "A little hiccup along the way."
        }}
      </h1>
      <p class="mt-4 mb-8 text-sm text-muted-foreground">
        {{
          error.statusCode === 404
            ? "Try another destination in your workspace. Let's get you back to a useful starting point."
            : "Something interrupted the journey. Your local work is still here. Return to the workspace and try again."
        }}
      </p>
      <UiButton @click="clearError({ redirect: '/' })">
        Back to Launchpad <Icon name="lucide:arrow-up-right" />
      </UiButton>
      <p class="mt-12 text-xs text-muted-foreground">
        Launchpad · Designed & built by
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
