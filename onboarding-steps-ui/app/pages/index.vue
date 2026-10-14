<script setup lang="ts">
  const { currentStep } = useOnboarding();
  usePageSeo({ title: undefined });

  const stepComponents = [
    resolveComponent("WaypointStepRegister"),
    resolveComponent("WaypointStepVerify"),
    resolveComponent("WaypointStepInvite"),
    resolveComponent("WaypointStepWelcome"),
  ];

  // Move focus to the new step's heading so keyboard and screen reader users land on it.
  const focusHeading = () =>
    document.getElementById("step-heading")?.focus({ preventScroll: true });
</script>
<template>
  <Transition name="step" mode="out-in" @after-enter="focusHeading">
    <component :is="stepComponents[currentStep - 1]" :key="currentStep" class="w-full" />
  </Transition>
</template>
