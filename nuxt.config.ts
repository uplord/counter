// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", 'nuxt-strapi-blocks-renderer'],
  runtimeConfig: {
    public: {
      strapiApi: process.env.STRAPI_API,
      strapiBearer: process.env.STRAPI_BEARER
    }
  },
  srcDir: "src/",
})
