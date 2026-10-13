<script setup lang="ts">
  definePageMeta({ layout: "auth", key: (route) => route.fullPath });
  usePageSeo({ title: "Demo reset" });
</script>
<template><LaunchpadAuthForm action="reset-password" /></template>
