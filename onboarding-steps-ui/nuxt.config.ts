// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  experimental: { typedPages: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/test-utils/module",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@morev/vue-transitions/nuxt",
    "@vee-validate/nuxt",
  ],
  tailwindcss: { exposeConfig: true, editorSupport: true },
  colorMode: { classSuffix: "", preference: "light", storageKey: "onboarding-steps-ui" },
  icon: {
    customCollections: [{ dir: "./app/assets/icons", prefix: "i" }],
    clientBundle: { scan: true, sizeLimitKb: 0 },
    mode: "svg",
  },
  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      { from: "vue-sonner", name: "toast", as: "useSonner" },
    ],
  },

  build: { transpile: ["vue-sonner"] },
});
