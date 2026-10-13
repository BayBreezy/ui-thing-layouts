<template>
  <UiEmpty class="border">
    <UiEmptyHeader>
      <UiEmptyMedia variant="icon"><Icon :name="icon || 'lucide:sparkles'" /></UiEmptyMedia>
      <UiEmptyTitle as="h2">{{ title || "A little room for something new" }}</UiEmptyTitle>
      <UiEmptyDescription>
        {{ description || "Try another filter, or create your first record." }}
      </UiEmptyDescription>
    </UiEmptyHeader>
    <UiEmptyContent v-if="$slots.default"><slot /></UiEmptyContent>
  </UiEmpty>
</template>
<script setup lang="ts">
  defineProps<{ title?: string; description?: string; icon?: string }>();
</script>
