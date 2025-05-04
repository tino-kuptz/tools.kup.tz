import { defineNuxtPlugin } from '#app'
import { useTokenStore } from '../stores/tokens.js'

export default defineNuxtPlugin(async (nuxtApp) => {
    const store = useTokenStore(nuxtApp.$pinia)

    await store.fetch(true)
})
