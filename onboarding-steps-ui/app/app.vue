<script setup lang="ts">
  // Flips once the app is interactive, so browser tests do not type into a form that has not
  // hydrated yet.
  const ready = ref(false);
  onMounted(() => (ready.value = true));
</script>
<template>
  <div :data-app-ready="ready">
    <NuxtLoadingIndicator color="var(--primary)" />
    <NuxtAnnouncer />
    <NuxtLayout><NuxtPage /></NuxtLayout>
    <UiSonner position="bottom-right" />
  </div>
</template>
