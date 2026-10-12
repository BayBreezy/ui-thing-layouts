<script setup lang="ts">
  definePageMeta({ layout: "auth" });
  usePageSeo({
    title: "Login",
    description: "Log in to the Orbit demo. No real account is created and no password is stored.",
  });
</script>
<template><OrbitAuthForm mode="login" /></template>
