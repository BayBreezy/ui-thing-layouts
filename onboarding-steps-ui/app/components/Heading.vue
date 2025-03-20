<template>
  <img src="/logo.jpg" alt="Logo" class="mx-auto h-14 rounded-md" />
  <div class="flex flex-col items-center gap-1">
    <h2 class="text-center text-2xl font-semibold">{{ title }}</h2>
    <p class="text-center text-muted-foreground">{{ description }}</p>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    /**
     * The title of the heading.
     * @example Welcome to the app
     */
    title: string;
    /**
     * The description of the heading.
     * @example This is a description
     */
    description: string;
  }>();
</script>
