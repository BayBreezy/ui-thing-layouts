// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@vee-validate/nuxt",
    "@morev/vue-transitions/nuxt",
    "@nuxtjs/mdc",
  ],
  mdc: {
    highlight: {
      wrapperStyle: true,
      theme: {
        // Default theme (same as single string)
        default: "github-light",
        // Theme used if `html.dark`
        dark: "andromeeda",
      },
    },
  },
  tailwindcss: { exposeConfig: true, editorSupport: true },
  colorMode: { classSuffix: "", preference: "light", fallback: "light", storageKey: "ui-ai-chat" },
  icon: { clientBundle: { scan: true, sizeLimitKb: 0 } },

  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      {
        from: "vue-sonner",
        name: "toast",
        as: "useSonner",
      },
    ],
  },

  build: {
    transpile: ["vue-sonner"],
  },
});
