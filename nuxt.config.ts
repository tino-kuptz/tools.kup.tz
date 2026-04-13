import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';
import vuetify from 'vite-plugin-vuetify';
import svgLoader from 'vite-svg-loader';


export default defineNuxtConfig({
  ssr: true,

  // App source lives under ./app (Nuxt 4 + Vite 7 expect consistent ~ / @ resolution)
  srcDir: 'app/',

  app: {
    head: {
      titleTemplate: '%s - tools.kup.tz',
      title: 'tools.kup.tz',

      link: [{
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      }],
    },
  },

  devtools: {
    enabled: true,
  },

  // Order matters: Vuetify base → Vuetify theme overrides → app shell (Nuxt 4 + Vite 7)
  css: [
    'vuetify/styles',
    '@core/scss/template/libs/vuetify/index.scss',
    '@/@core/scss/template/index.scss',
    '@styles/styles.scss',
    '@/plugins/iconify/icons.css',
    '@layouts/styles/index.scss',
    '@/assets/fonts/index.css',
  ],

  components: {
    dirs: [{
      path: '@/@core/components',
      pathPrefix: false,
    }, {
      path: '~/components/global',
      global: true,
    }, {
      path: '~/components',
      pathPrefix: false,
    }],
  },

  plugins: ['@/plugins/vuetify/index.js', '@/plugins/iconify/index.js'],

  imports: {
    dirs: ['./@core/utils', './@core/composable/', './plugins/*/composables/*'],
  },

  hooks: {},

  experimental: {
    typedPages: true,
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '@/*': ['../*'],
          '@layouts/*': ['../@layouts/*'],
          '@layouts': ['../@layouts'],
          '@core/*': ['../@core/*'],
          '@core': ['../@core'],
          '@images/*': ['../assets/images/*'],
          '@styles/*': ['../assets/styles/*'],
        },
      },
    },
  },

  // ℹ️ Disable source maps until this is resolved: https://github.com/vuetifyjs/vuetify-loader/issues/290
  sourcemap: {
    server: false,
    client: false,
  },

  vue: {
    compilerOptions: {
      isCustomElement: tag => tag === 'swiper-container' || tag === 'swiper-slide',
    },
  },

  vite: {
    define: { 'process.env': {} },

    // Required so Vuetify SSR bundle resolves theme/CSS variable injection correctly (Nuxt 4 + Vite 7)
    ssr: {
      noExternal: ['vuetify'],
    },

    resolve: {
      alias: {
        // Project-root aliases (nuxt.config lives in repo root)
        '@': fileURLToPath(new URL('./app', import.meta.url)),
        '@core': fileURLToPath(new URL('./app/@core', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./app/@layouts', import.meta.url)),
        '@images': fileURLToPath(new URL('./app/assets/images/', import.meta.url)),
        '@styles': fileURLToPath(new URL('./app/assets/styles/', import.meta.url)),
        '@configured-variables': fileURLToPath(new URL('./app/assets/styles/variables/_template.scss', import.meta.url)),
        'pinia': fileURLToPath(new URL('./node_modules/pinia/dist/pinia.mjs', import.meta.url)),
      },
    },

    build: {
      chunkSizeWarningLimit: 5000,
    },

    optimizeDeps: {
      exclude: ['vuetify'],
      include: ['pinia'],
    },

    plugins: [
      svgLoader(),
      vuetify({
        styles: {
          configFile: fileURLToPath(new URL('./app/assets/styles/variables/_vuetify.scss', import.meta.url)),
        },
      }),
    ],
  },

  build: {
    transpile: ['vuetify'],
  },

  features: {
    inlineStyles: false,
  },

  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
    output: {
      dir: 'dist',
    },
  },

  routeRules: {
    // Die ändert sich sowieso mit jedem mal rendern
    '/track/http/**': { prerender: false },
  },

  modules: [
    [
      '@vueuse/nuxt',
      {}
    ],
    [
      '@nuxtjs/device',
      {}
    ], [
      '@pinia/nuxt',
      {}
    ], [
      '@nuxtjs/i18n',
      {
        locales: [
          {
            code: 'de',
            iso: 'de-DE',
            name: 'Deutsch',
            file: 'de.json',
          },
          {
            code: 'en',
            iso: 'en-US',
            name: 'English',
            file: 'en.json',
          },
        ],
        defaultLocale: 'de',
        strategy: 'prefix_except_default',
        langDir: '../i18n/locales',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'i18n_redirected',
          redirectOn: 'root',
        },
      },
    ],
  ],

  compatibilityDate: '2025-05-04',
})
