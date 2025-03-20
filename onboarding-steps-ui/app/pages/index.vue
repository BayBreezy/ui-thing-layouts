<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <TransitionFade mode="out-in">
      <template v-if="currentStep == 1">
        <Register />
      </template>
      <template v-if="currentStep == 2">
        <Verify />
      </template>
      <template v-if="currentStep == 3">
        <InviteTeam />
      </template>
      <template v-if="currentStep == 4">
        <Welcome />
      </template>
    </TransitionFade>
    <Bars />
  </div>
</template>

<script lang="ts" setup>
  const { currentStep } = useTimeline();
</script>
