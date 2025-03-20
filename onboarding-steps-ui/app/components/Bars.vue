<template>
  <div class="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2">
    <template v-for="item in steps" :key="item.id">
      <div
        class="h-2 w-24 rounded-full bg-muted"
        :class="[currentStep === item.id ? 'bg-primary' : '']"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
  const { steps, currentStep } = useTimeline();
</script>
