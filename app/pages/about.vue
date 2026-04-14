<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.about.title'),
    meta: [
        {
            description: t('pages.about.description'),
        },
    ],
})

import { useTokenStore } from '../stores/tokens.js';
const tokenStore = useTokenStore()
</script>

<template>
    <div>
        <VCard :title="t('pages.about.title')">
            <VCardText>
                {{ t('pages.about.content.intro') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.content.development') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.content.contact') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.content.hosting') }}
            </VCardText>
        </VCard>


        <VCard class="mt-4" :title="t('pages.about.tokens.title')" id="tokens">
            <VCardText>
                {{ t('pages.about.tokens.intro') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.tokens.abuse') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.tokens.generation') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.tokens.reset') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.tokens.opensource') }}
            </VCardText>
            <VCardText>
                {{ t('pages.about.tokens.current.subnet') }} <strong>{{ tokenStore.token.ip }}</strong>.<br>
                {{ t('pages.about.tokens.current.limit') }} <strong>{{ tokenStore.token.limit }}</strong> {{
                    t('pages.about.tokens.current.tokens') }}
                <strong>{{ tokenStore.token.used }}</strong> {{ t('pages.about.tokens.current.used') }}
                <strong>{{ tokenStore.token.remaining }}</strong> {{ t('pages.about.tokens.current.remaining') }}
            </VCardText>
        </VCard>
    </div>
</template>
