// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@vee-validate/nuxt",
    "@morev/vue-transitions/nuxt",
    "@hypernym/nuxt-gsap",
  ],
  gsap: { provide: false, composables: true },
  tailwindcss: { exposeConfig: true, editorSupport: true },
  icon: { clientBundle: { scan: true, sizeLimitKb: 0 } },
  imports: {
    imports: [
      { from: "tailwind-variants", name: "tv" },
      { from: "tailwind-variants", name: "VariantProps", type: true },
      { from: "vue-sonner", name: "toast", as: "useSonner" },
    ],
  },

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

  build: { transpile: ["vue-sonner"] },
});
