<template>
  <span class="inline-flex items-center gap-2">
    <img src="/orbit.svg" width="32" height="32" alt="" class="shrink-0 rounded-lg" />
    <span v-if="!compact" class="text-lg font-semibold tracking-tight"
      >orbit<span class="text-primary">.</span></span
    >
  </span>
</template>
<script setup lang="ts">
  defineProps<{ compact?: boolean }>();
</script>
