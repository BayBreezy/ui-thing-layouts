<template>
  <UiEmpty class="border">
    <UiEmptyHeader>
      <UiEmptyMedia variant="icon"><Icon :name="icon || 'lucide:calendar-x'" /></UiEmptyMedia>
      <UiEmptyTitle as="h2">{{ title || "Nothing here yet" }}</UiEmptyTitle>
      <UiEmptyDescription>
        {{ description || "Try another filter, or add your first record." }}
      </UiEmptyDescription>
    </UiEmptyHeader>
    <UiEmptyContent v-if="$slots.default"><slot /></UiEmptyContent>
  </UiEmpty>
</template>
<script setup lang="ts">
  defineProps<{ title?: string; description?: string; icon?: string }>();
</script>
