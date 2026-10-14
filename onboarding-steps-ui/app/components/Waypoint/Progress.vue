<script setup lang="ts">
  const { steps, currentStep } = useOnboarding();
</script>
<template>
  <div class="flex items-center justify-center gap-2 pb-2" data-testid="progress">
    <span class="sr-only">Step {{ currentStep }} of {{ steps.length }}</span>
    <span
      v-for="item in steps"
      :key="item.id"
      aria-hidden="true"
      data-bar
      :data-active="currentStep >= item.id ? 'true' : undefined"
      class="h-1.5 w-16 rounded-full bg-muted transition-colors data-[active=true]:bg-primary sm:w-24"
    />
  </div>
</template>
