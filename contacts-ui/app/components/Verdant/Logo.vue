<script setup lang="ts">
  defineProps<{ compact?: boolean }>();
</script>
<template>
  <span class="inline-flex items-center gap-2">
    <img src="/verdant.svg" width="32" height="32" alt="" class="shrink-0 rounded-lg" />
    <span v-if="!compact" class="text-lg font-semibold tracking-tight"
      >verdant<span class="text-primary">.</span></span
    >
  </span>
</template>
