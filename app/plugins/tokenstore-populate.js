import { useTokenStore } from '../stores/tokens.js'

export default defineNuxtPlugin({
  name: 'tokenstore-populate',
  dependsOn: ['vuetify'],
  async setup(nuxtApp) {
    const store = useTokenStore(nuxtApp.$pinia)

    await store.fetch(true)
  },
})
