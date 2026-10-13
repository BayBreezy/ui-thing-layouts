<script setup lang="ts">
  defineProps<{ exists: boolean; back: string; backLabel?: string }>();
  const { ready } = useDemo();
</script>
<template>
  <div v-if="!ready" role="status" aria-label="Restoring the schedule">
    <UiSkeleton class="h-96" />
  </div>
  <slot v-else-if="exists" /><MendlyEmpty
    v-else
    title="We couldn't find that record"
    description="It may belong to another browser, or have been removed when the demo was reset."
    icon="lucide:file-search"
    ><UiButton :to="back" variant="outline">{{ backLabel || "Go back" }}</UiButton></MendlyEmpty
  >
</template>
