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

  const title = "Site Analytics Dashboard - Track and Optimize Website Performance | UI Thing";
  const description =
    "Monitor your website's performance with this Site Analytics Dashboard. Get real-time insights into traffic, user behavior, and conversions with a clean, modern UI.";
  const image = "/cover.jpeg";

  useSeoMeta({
    title,
    description,
    author: "UI Thing",
    keywords:
      "site analytics, website tracking, traffic analysis, SEO dashboard, user behavior, performance monitoring, Vue analytics UI, React analytics dashboard",
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
