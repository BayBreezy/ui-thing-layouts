<template>
  <div class="dark">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiVueSonner />
  </div>
</template>

<script lang="ts" setup>
  const title = "Contacts UI Dashboard - Manage Your Contacts Efficiently | UI Thing";
  const description =
    "Organize and manage your contacts easily with this modern and responsive Contacts UI Dashboard. Fast performance, powerful search, and seamless user experience.";
  const image = "/cover.jpeg";

  useHead({
    htmlAttrs: { lang: "en", class: "bg-sidebar dark" },
    link: [{ rel: "icon", type: "image/png", href: "/icon.png" }],
  });

  useSeoMeta({
    title,
    description,
    author: "UI Thing",
    keywords:
      "contacts dashboard, contact manager, UI dashboard, contact app, Vue dashboard, React dashboard",
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
    themeColor: "#009966",
  });

  onMounted(() => {
    const tl = useGsap.timeline();
    tl.from(`.${GSAP_SIDEBAR}`, { opacity: 0, y: 10, stagger: 0.1 }).from(
      `.${GSAP_EL}`,
      {
        opacity: 0,
        y: 10,
        stagger: 0.08,
      },
      "<"
    );
  });
</script>
