<script setup lang="ts">
  definePageMeta({ layout: "auth", key: (route) => route.fullPath });
  usePageSeo({ title: "Demo reset" });
</script>
<template><BeaconAuthForm action="reset-password" /></template>
