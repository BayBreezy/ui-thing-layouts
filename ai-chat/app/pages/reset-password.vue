<script setup lang="ts">
  definePageMeta({ layout: "auth", key: (route) => route.fullPath });
  usePageSeo({
    title: "Reset Password",
    description: "Choose a new password to complete the simulated reset in the Orbit demo.",
  });
</script>
<template><OrbitAuthForm mode="reset-password" /></template>
