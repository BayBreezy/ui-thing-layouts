<script setup lang="ts">
  definePageMeta({ layout: "auth" });
  usePageSeo({
    title: "Signup",
    description:
      "Create a demo account to explore Orbit. No real account is created and no password is stored.",
  });
</script>
<template><OrbitAuthForm mode="signup" /></template>
