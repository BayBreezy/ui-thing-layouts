<script setup lang="ts">
  const route = useRoute();
  definePageMeta({ key: (route) => route.fullPath });
</script>
<template><OrbitChatWorkspace :conversation-id="String(route.params.id)" /></template>
