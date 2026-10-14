<script setup lang="ts">
  const { steps, currentStep, current } = useOnboarding();
</script>
<template>
  <header class="flex items-center justify-between md:hidden">
    <WaypointLogo />
    <p class="text-sm text-muted-foreground" aria-hidden="true">
      Step {{ currentStep }} of {{ steps.length
      }}<span class="hidden sm:inline"> · {{ current.title }}</span>
    </p>
  </header>
</template>
