<script setup lang="ts">
  defineProps<{ message: string }>();
</script>
<template>
  <UiAlert
    v-if="message"
    role="alert"
    variant="destructive"
    icon="lucide:circle-alert"
    :description="message"
  />
</template>
