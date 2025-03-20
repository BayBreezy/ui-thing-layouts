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
  const title = "Onboarding Steps UI - Simplify User Onboarding | UI Thing";
  const description =
    "Create a smooth and engaging onboarding experience with this Onboarding Steps UI. Guide users step-by-step with a clean and intuitive interface.";
  const image = "/cover.jpeg";

  useHead({
    htmlAttrs: { lang: "en" },
    link: [{ rel: "icon", type: "image/jpeg", href: "/logo.jpg" }],
  });

  useSeoMeta({
    title,
    description,
    author: "UI Thing",
    keywords:
      "onboarding UI, onboarding steps, user onboarding, smooth onboarding, Vue onboarding UI, React onboarding, onboarding interface",
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
    themeColor: "#09090b",
  });
</script>
