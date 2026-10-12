<script setup lang="ts">
  import type { NuxtError } from "#app";
  defineProps<{ error: NuxtError }>();
  useHead({ title: "Lost in orbit · Orbit" });
</script>
<template>
  <main class="flex min-h-svh items-center justify-center p-6">
    <div class="max-w-lg text-center">
      <OrbitLogo class="mb-10 justify-center" />
      <p class="mb-4 font-mono text-sm text-primary">{{ error.statusCode }}</p>
      <h1 class="text-3xl font-semibold tracking-tight">A little lost in orbit?</h1>
      <p class="mt-4 mb-8 text-sm text-muted-foreground">
        {{
          error.statusCode === 404
            ? "This page has drifted out of view. Let’s get you back to a useful starting point."
            : "Something interrupted the journey. Your local work is still here. Try returning to the workspace."
        }}
      </p>
      <UiButton @click="clearError({ redirect: '/' })">
        Back to workspace <Icon name="lucide:arrow-up-right" />
      </UiButton>
      <p class="mt-12 text-xs text-muted-foreground">
        Orbit · Designed & built by
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
