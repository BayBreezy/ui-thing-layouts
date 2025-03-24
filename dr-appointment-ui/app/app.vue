<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiVueSonner />
  </div>
</template>

<script lang="ts" setup>
  useHead({
    htmlAttrs: { lang: "en" },
    link: [{ rel: "icon", type: "image/jpeg", href: "/logo.jpg" }],
  });
  const image = "/cover.jpeg";
  const title = "Doctor Appointment UI - Schedule and Manage Medical Appointments | UI Thing";
  const description =
    "Enhance patient experience with this Doctor Appointment UI. Schedule, reschedule, and manage appointments with a user-friendly and responsive interface.";

  useSeoMeta({
    title,
    description,
    author: "UI Thing",
    keywords:
      "doctor appointment, patient booking, medical scheduling, healthcare UI, appointment management, Vue doctor appointment UI, React medical dashboard",
    robots: "index, follow",
    ogTitle: title,
    ogDescription: description,
    ogType: "website",
    ogImage: image,
    ogUrl: import.meta.env.PUBLIC_URL || "http://localhost:3000",
    twitterTitle: title,
    twitterDescription: description,
    twitterCard: "summary_large_image",
    twitterImage: image,
    themeColor: "#2463EB",
  });
</script>
