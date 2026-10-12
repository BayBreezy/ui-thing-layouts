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
    "@nuxtjs/mdc",
    "vue-sonner/nuxt",
  ],
  css: ["~/assets/css/tailwind.css", "~/assets/css/orbit.css"],
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
      include: [
        "@shikijs/core",
        "@shikijs/engine-javascript",
        "@shikijs/engine-oniguruma",
        "@shikijs/langs/css",
        "@shikijs/langs/javascript",
        "@shikijs/langs/json",
        "@shikijs/langs/shellscript",
        "@shikijs/langs/typescript",
        "@shikijs/langs/vue",
        "@shikijs/themes/github-dark",
        "@shikijs/themes/github-light",
        "@shikijs/transformers",
        "idb",
        "micromark > debug", // CJS
        "reka-ui",
        "shiki/wasm",
        "tailwind-variants",
        "vue3-apexcharts",
        "yup",
      ],
    },
  },

  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "orbit-color-mode",
  },
  icon: {
    clientBundle: { scan: true, sizeLimitKb: 256 },
    serverBundle: { collections: ["lucide"] },
  },
  mdc: {
    highlight: {
      theme: { default: "github-light", dark: "github-dark" },
      langs: ["typescript", "javascript", "vue", "json", "bash", "css"],
    },
  },
  runtimeConfig: { public: { siteUrl: "https://ai-chat-ui.behonbaker.com" } },
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
      link: [{ rel: "icon", type: "image/svg+xml", href: "/orbit.svg" }],
    },
  },
});
