<script setup>
import { computed, reactive } from 'vue'

useHead({
    title: 'DKIM Generator',
    meta: [{ description: 'Erstellt DKIM-Schlüsselpaare im Browser (WebCrypto) und generiert den DNS-Eintrag.' }],
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
        $toast.error('Bitte Selector und Domain angeben', { position: 'bottom-center' })
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
        $toast.success('DKIM-Schlüssel erstellt', { position: 'bottom-center' })
    } catch (e) {
        $toast.error('Fehler bei der DKIM-Generierung: ' + e.message, { position: 'bottom-center' })
    } finally {
        dkim.generating = false
    }
}

const copyText = async (text, msg) => {
    try {
        await navigator.clipboard.writeText(text)
        $toast.success(msg, { position: 'bottom-center' })
    } catch (e) {
        $toast.error('Fehler beim Kopieren: ' + e.message, { position: 'bottom-center' })
    }
}
</script>

<template>
    <div>
        <h1 class="mb-4">DKIM Generator</h1>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">Über dieses Tool</div>
                    <div class="text-h6 mb-1">
                        Erstelle DKIM-Schlüsselpaare ausschließlich im Browser (WebCrypto). Es werden keine Daten an den
                        Server gesendet.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-4">Einstellungen</h3>
                        <VTextField v-model="dkim.selector" label="Selector" placeholder="default" variant="outlined"
                            class="mb-3" />
                        <VTextField v-model="dkim.domain" label="Domain" placeholder="example.com" variant="outlined"
                            class="mb-3" />
                        <VSelect v-model="dkim.keySize" label="Schlüssellänge" :items="[
                            { title: '2048 Bit', value: 2048 },
                            { title: '1024 Bit', value: 1024 }
                        ]" variant="outlined" class="mb-4" />

                        <VBtn color="primary" :loading="dkim.generating" @click="generateDkim">
                            Generieren
                        </VBtn>
                    </VCol>

                    <VCol cols="12" md="6">
                        <h3 class="mb-2">DNS-Eintrag</h3>
                        <VCard variant="outlined" class="mb-4">
                            <VCardText>
                                <div class="mb-2">
                                    <div class="text-caption">Record-Name</div>
                                    <code>{{ dkimRecordName }}</code>
                                </div>
                                <div>
                                    <div class="text-caption">Record-Wert</div>
                                    <code>{{ buildDkimDnsRecord }}</code>
                                </div>
                            </VCardText>
                            <VCardActions>
                                <VBtn variant="text" @click="copyText(dkimRecordName, 'Record-Name kopiert')">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    Namen kopieren
                                </VBtn>
                                <VBtn variant="text" @click="copyText(buildDkimDnsRecord, 'DNS-Eintrag kopiert')">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    Eintrag kopieren
                                </VBtn>
                            </VCardActions>
                        </VCard>

                        <h3 class="mb-2">Privater Schlüssel</h3>
                        <VCard variant="outlined">
                            <VCardText>
                                <pre class="private-key">{{ dkim.privateKeyPem }}</pre>
                            </VCardText>
                            <VCardActions>
                                <VBtn variant="text"
                                    @click="copyText(dkim.privateKeyPem, 'Privaten Schlüssel kopiert')">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    Kopieren
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
