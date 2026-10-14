<script setup lang="ts">
  defineProps<{ title: string; description: string }>();
</script>
<template>
  <div class="flex flex-col items-center gap-1.5 text-center">
    <WaypointLogo compact class="mb-3" />
    <h1 id="step-heading" tabindex="-1" class="text-2xl font-semibold tracking-tight outline-none">
      {{ title }}
    </h1>
    <p class="text-muted-foreground">{{ description }}</p>
  </div>
</template>
