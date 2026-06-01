// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  imports: { autoImport: false },

  routeRules: {
    // FIXME: if this line is commented out, the build works fine
    '/rendering-modes/pre-rendered-page': { prerender: true },
  },
});
