// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-04-22',
  srcDir: 'app',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
  typescript: {
    strict: true
  },

  runtimeConfig: {
    // Server-side only
    freqtradeUrl: process.env.FREQTRADE_URL || '',
    freqtradeUser: process.env.FREQTRADE_USER || '',
    freqtradePass: process.env.FREQTRADE_PASS || '',

    // Public (client-side)
    public: {
      demoMode: process.env.DEMO_MODE === 'true'
    }
  },

  app: {
    head: {
      title: 'Freqtrade Dashboard',
      meta: [
        { name: 'description', content: 'Advanced Freqtrade Bot Dashboard' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' }
      ]
    }
  }
})
