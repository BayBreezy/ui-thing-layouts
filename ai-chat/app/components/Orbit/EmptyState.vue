<template>
  <UiEmpty class="border">
    <UiEmptyHeader>
      <UiEmptyMedia variant="icon"><Icon :name="icon || 'lucide:search'" /></UiEmptyMedia>
      <UiEmptyTitle as="h2">{{ title }}</UiEmptyTitle>
      <UiEmptyDescription>{{ description }}</UiEmptyDescription>
    </UiEmptyHeader>
    <UiEmptyContent v-if="$slots.default"><slot /></UiEmptyContent>
  </UiEmpty>
</template>
<script setup lang="ts">
  defineProps<{ title: string; description: string; icon?: string }>();
</script>
