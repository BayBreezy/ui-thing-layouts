import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2026-10-11",
  devtools: { enabled: true },
  modules: [
    "@nuxt/icon",
    "@nuxt/fonts",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@vee-validate/nuxt",
    "vue-sonner/nuxt",
    "motion-v/nuxt",
  ],
  css: ["~/assets/css/tailwind.css", "~/assets/css/waypoint.css"],
  fonts: {
    provider: "local",
    processCSSVariables: false,
    families: [
      {
        name: "Inter",
        src: "/fonts/InterVariable.woff2",
        weight: "100 900",
        style: "normal",
        global: true,
      },
      // Nuxt Fonts 1.0 treats Tailwind variable references as family names.
      // Inter is injected globally above; leave these references untouched.
      { name: "var(--font-sans)", provider: "none" },
      { name: "var(--font-mono)", provider: "none" },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@vee-validate/yup", "@vue/devtools-core", "reka-ui", "tailwind-variants", "yup"],
    },
  },
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "waypoint-color-mode",
  },
  icon: {
    clientBundle: { scan: true, sizeLimitKb: 256 },
    serverBundle: { collections: ["lucide", "logos"] },
  },
  runtimeConfig: { public: { siteUrl: "https://waypoint.behonbaker.com" } },
  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      { from: "vue-sonner", name: "toast", as: "useSonner" },
    ],
  },
  typescript: { strict: true },
  app: {
    head: {
      htmlAttrs: { lang: "en" },
      link: [
        // The .ico covers Safari and older crawlers; browsers that understand SVG pick the SVG.
        { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
        { rel: "icon", type: "image/svg+xml", href: "/waypoint.svg" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
    },
  },
});
