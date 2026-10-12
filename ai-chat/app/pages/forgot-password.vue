<script setup lang="ts">
  definePageMeta({ layout: "auth" });
  usePageSeo({
    title: "Forgot Password",
    description: "Request a simulated password reset link for the Orbit demo. No email is sent.",
  });
</script>
<template><OrbitAuthForm mode="forgot-password" /></template>
