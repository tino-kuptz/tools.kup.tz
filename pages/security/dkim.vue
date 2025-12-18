<script setup>
import { computed, reactive } from 'vue';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.security.dkim.title'),
    meta: [{ description: t('pages.security.dkim.description') }],
})

const { $toast } = useNuxtApp()

const dkim = reactive({
    selector: 'default',
    domain: '',
    keySize: 2048,
    generating: false,
    publicKeyBase64: '',
    privateKeyPem: '',
})

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
}

const toPem = (base64, type) => {
    const lines = base64.match(/.{1,64}/g) || []
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`
}

const dkimRecordName = computed(() => {
    if (!dkim.selector || !dkim.domain) return ''
    return `${dkim.selector}._domainkey.${dkim.domain}`
})

const buildDkimDnsRecord = computed(() => {
    if (!dkim.publicKeyBase64) return ''
    return `v=DKIM1; k=rsa; p=${dkim.publicKeyBase64}`
})

const generateDkim = async () => {
    if (!dkim.selector.trim() || !dkim.domain.trim()) {
        $toast.error(t('common.errors.pleaseEnterSelectorAndDomain'), { position: 'bottom-center' })
        return
    }
    try {
        dkim.generating = true
        const key = await crypto.subtle.generateKey({
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: dkim.keySize,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256',
        }, true, ['sign', 'verify'])

        const spki = await crypto.subtle.exportKey('spki', key.publicKey)
        const pkcs8 = await crypto.subtle.exportKey('pkcs8', key.privateKey)

        const pubB64 = arrayBufferToBase64(spki)
        const privB64 = arrayBufferToBase64(pkcs8)

        dkim.publicKeyBase64 = pubB64
        dkim.privateKeyPem = toPem(privB64, 'PRIVATE KEY')
        $toast.success(t('pages.security.dkim.success'), { position: 'bottom-center' })
    } catch (e) {
        $toast.error(t('pages.security.dkim.error') + ': ' + e.message, { position: 'bottom-center' })
    } finally {
        dkim.generating = false
    }
}

const copyText = async (text, msg) => {
    try {
        await navigator.clipboard.writeText(text)
        $toast.success(msg, { position: 'bottom-center' })
    } catch (e) {
        $toast.error(t('common.copyError') + ': ' + e.message, { position: 'bottom-center' })
    }
}
</script>

<template>
    <div>
        <h1 class="mb-4">{{ t('pages.security.dkim.heading') }}</h1>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">{{ t('common.about') }}</div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.security.dkim.descriptionText') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-4">{{ t('pages.security.dkim.settings') }}</h3>
                        <VTextField v-model="dkim.selector" :label="t('pages.security.dkim.selector')"
                            :placeholder="t('pages.security.dkim.selectorPlaceholder')" variant="outlined"
                            class="mb-3" />
                        <VTextField v-model="dkim.domain" :label="t('common.domain')"
                            :placeholder="t('common.placeholder.domain')" variant="outlined" class="mb-3" />
                        <VSelect v-model="dkim.keySize" :label="t('pages.security.dkim.keyLength')" :items="[
                            { title: '2048 Bit', value: 2048 },
                            { title: '1024 Bit', value: 1024 }
                        ]" variant="outlined" class="mb-4" />

                        <VBtn color="primary" :loading="dkim.generating" @click="generateDkim">
                            {{ t('common.generate') }}
                        </VBtn>
                    </VCol>

                    <VCol cols="12" md="6">
                        <h3 class="mb-2">{{ t('pages.security.dkim.dnsEntry') }}</h3>
                        <VCard variant="outlined" class="mb-4">
                            <VCardText>
                                <div class="mb-2">
                                    <div class="text-caption">{{ t('pages.security.dkim.recordName') }}</div>
                                    <code>{{ dkimRecordName }}</code>
                                </div>
                                <div>
                                    <div class="text-caption">{{ t('pages.security.dkim.recordValue') }}</div>
                                    <code>{{ buildDkimDnsRecord }}</code>
                                </div>
                            </VCardText>
                            <VCardActions>
                                <VBtn variant="text"
                                    @click="copyText(dkimRecordName, t('pages.security.dkim.copyNameSuccess'))">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    {{ t('pages.security.dkim.copyName') }}
                                </VBtn>
                                <VBtn variant="text"
                                    @click="copyText(buildDkimDnsRecord, t('pages.security.dkim.copyEntrySuccess'))">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    {{ t('pages.security.dkim.copyEntry') }}
                                </VBtn>
                            </VCardActions>
                        </VCard>

                        <h3 class="mb-2">{{ t('pages.security.dkim.privateKey') }}</h3>
                        <VCard variant="outlined">
                            <VCardText>
                                <pre class="private-key">{{ dkim.privateKeyPem }}</pre>
                            </VCardText>
                            <VCardActions>
                                <VBtn variant="text"
                                    @click="copyText(dkim.privateKeyPem, t('pages.security.dkim.copyPrivateKeySuccess'))">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    {{ t('pages.security.dkim.copyPrivateKey') }}
                                </VBtn>
                            </VCardActions>
                        </VCard>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
    </div>
</template>

<style scoped>
.private-key {
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
