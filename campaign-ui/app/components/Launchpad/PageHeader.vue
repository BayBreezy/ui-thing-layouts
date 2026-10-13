<template>
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="max-w-2xl text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2"><slot /></div>
  </header>
</template>
<script setup lang="ts">
  defineProps<{ title: string; description?: string }>();
</script>
