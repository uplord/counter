// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", 'nuxt-strapi-blocks-renderer'],
  runtimeConfig: {
    public: {
      apiBaseURL: process.env.API_BASE_URL,
    }
  },
  srcDir: "src/",
  ssr: false,
})
