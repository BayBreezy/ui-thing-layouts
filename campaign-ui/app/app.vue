<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
  const title = "Campaign Management UI - Manage and Optimize Your Campaigns | UI Thing";
  const description =
    "Streamline your marketing efforts with this powerful Campaign Management UI. Create, track, and optimize your campaigns with ease using a modern and responsive interface.";
  const image = "/cover.jpeg";

  useHead({
    htmlAttrs: { lang: "en" },
    link: [{ rel: "icon", type: "image/png", href: "/icon.png" }],
  });

  useSeoMeta({
    title,
    description,
    author: "UI Thing",
    keywords:
      "campaign management, marketing dashboard, campaign tracking, campaign UI, campaign optimizer, Vue campaign UI, React campaign UI",
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
