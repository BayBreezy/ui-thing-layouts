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
    "@nuxt/test-utils",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@vee-validate/nuxt",
    "@morev/vue-transitions/nuxt",
    "v-wave/nuxt",
  ],

  icon: { size: "24px", clientBundle: { scan: true, sizeLimitKb: 0 }, mode: "svg" },
  tailwindcss: { exposeConfig: true, editorSupport: true },

  colorMode: {
    fallback: "light",
    preference: "light",
    storageKey: "dr-appointment-ui",
    classSuffix: "",
  },

  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      { from: "vue-sonner", name: "toast", as: "useSonner" },
    ],
  },

  build: { transpile: ["vue-sonner"] },

  app: {
    head: {
      script: [
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/pdfmake.min.js",
          defer: true,
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/vfs_fonts.min.js",
          defer: true,
        },
      ],
    },
  },
});