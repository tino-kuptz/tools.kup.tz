import { createVuetify } from 'vuetify'
import { computed } from 'vue'
import { VBtn } from 'vuetify/components/VBtn'
import defaults from './defaults'
import { icons } from './icons'
import { themes } from './theme'

// Styles are loaded globally from nuxt.config `css` (correct order vs. app SCSS)
// enforce: 'pre' — must run before other plugins (e.g. tokenstore) so --v-theme-* exist for SSR + hydration

export default defineNuxtPlugin({
  name: 'vuetify',
  enforce: 'pre',
  setup(nuxtApp) {
    const vuetify = createVuetify({
      ssr: true,
      aliases: {
        IconBtn: VBtn,
      },
      defaults,
      icons,
      theme: {
        defaultTheme: 'light',
        themes,
      },
    })

    nuxtApp.vueApp.use(vuetify)

    // Nuxt 4 + current Vuetify SSR can serialize the theme style tag as
    // `<style children="...">`, which browsers ignore. Inject it explicitly.
    useHead({
      style: [{
        key: 'vuetify-theme-fix',
        id: 'vuetify-theme-fix',
        textContent: computed(() => vuetify.theme.styles.value),
      }],
    })
  },
})
