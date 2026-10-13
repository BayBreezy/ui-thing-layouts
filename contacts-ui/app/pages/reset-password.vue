<script setup lang="ts">
  definePageMeta({ layout: "auth", key: (route) => route.fullPath });
  usePageSeo({ title: "Demo reset" });
</script>
<template><VerdantAuthForm action="reset-password" /></template>
