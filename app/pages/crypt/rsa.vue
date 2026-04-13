<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.crypt.rsa.title'),
    meta: [
        {
            description: t('pages.crypt.rsa.description'),
        },
    ],
})

const { $toast } = useNuxtApp()

const rsaPublicKey = ref('');
const rsaPrivateKey = ref('');
const isWorking = ref(false);

const encryptedText = ref('');
const decryptedText = ref('');

const rsaKeySizes = [
    { title: '1024 Bit', value: 1024 },
    { title: '2048 Bit', value: 2048 },
    { title: '4096 Bit', value: 4096 },
];
const rsaKeySize = ref(2048);

// Konvertiert Base64-String zu PEM-Format
const toPemFormat = (base64String, header, footer) => {
    // Base64-String in 64-Zeichen-Zeilen aufteilen
    const chunks = [];
    for (let i = 0; i < base64String.length; i += 64) {
        chunks.push(base64String.slice(i, i + 64));
    }
    return `${header}\n${chunks.join('\n')}\n${footer}`;
};

// Extrahiert Base64-String aus PEM-Format oder gibt den String zurück, falls bereits Base64
const fromPemFormat = (pemString) => {
    // Prüfe, ob es bereits PEM-Format ist
    if (pemString.includes('-----BEGIN')) {
        // Entferne Header, Footer und Whitespace
        return pemString
            .replace(/-----BEGIN[^-]+-----/g, '')
            .replace(/-----END[^-]+-----/g, '')
            .replace(/\s/g, '');
    }
    // Falls nicht PEM, entferne nur Whitespace (für Rückwärtskompatibilität)
    return pemString.replace(/\s/g, '');
};

const generateKeys = async () => {
    isWorking.value = true;
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 4096,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: { name: "SHA-256" },
            },
            true,
            ["encrypt", "decrypt"]
        );

        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", keyPair.publicKey))));
        const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey))));

        // Konvertiere zu PEM-Format
        rsaPublicKey.value = toPemFormat(publicKeyBase64, '-----BEGIN PUBLIC KEY-----', '-----END PUBLIC KEY-----');
        rsaPrivateKey.value = toPemFormat(privateKeyBase64, '-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----');

        $toast.success(t('pages.crypt.rsa.generateSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error(t('pages.crypt.rsa.generateError'), {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

const encryptUsingPublicKey = async () => {
    isWorking.value = true;
    try {
        // Extrahiere Base64-String aus PEM-Format falls nötig
        const publicKeyBase64 = fromPemFormat(rsaPublicKey.value);

        const privateKey = await window.crypto.subtle.importKey(
            "spki",
            Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0)),
            {
                name: "RSA-OAEP",
                hash: { name: "SHA-256" },
            },
            false,
            ["encrypt"]
        );

        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            privateKey,
            new TextEncoder().encode(decryptedText.value)
        );

        encryptedText.value = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));

        $toast.success(t('pages.crypt.rsa.encryptSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error(t('pages.crypt.rsa.encryptError'), {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};
const decryptUsingPrivateKey = async () => {
    isWorking.value = true;
    try {
        // Extrahiere Base64-String aus PEM-Format falls nötig
        const privateKeyBase64 = fromPemFormat(rsaPrivateKey.value);

        const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0)),
            {
                name: "RSA-OAEP",
                hash: { name: "SHA-256" },
            },
            false,
            ["decrypt"]
        );

        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            privateKey,
            Uint8Array.from(atob(encryptedText.value), c => c.charCodeAt(0))
        );

        decryptedText.value = new TextDecoder().decode(decryptedData);

        $toast.success(t('pages.crypt.rsa.decryptSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error(t('pages.crypt.rsa.decryptError'), {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.crypt.rsa.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.rsa.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.rsa.descriptionPrivacy') }}
                    </div>
                    <div class="text-h6 mb-1 text-muted">
                        {{ t('pages.crypt.rsa.descriptionNote', { size: rsaKeySize }) }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.rsa.publicKey') }}</h3>
                        <textarea v-model="rsaPublicKey" class="w-100"
                            placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----" rows="8"
                            :disabled="isWorking"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.rsa.pemFormat') }}</small>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.rsa.privateKey') }}</h3>
                        <textarea v-model="rsaPrivateKey" class="w-100"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" rows="8"
                            :disabled="isWorking"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.rsa.pemFormat') }}</small>
                    </VCol>
                    <VCol cols="12" class="d-flex align-left align-center">
                        <div style="width: 210px; display: inline-block; vertical-align: middle;" class="me-3">
                            <VSelect v-model="rsaKeySize" :items="rsaKeySizes" :label="t('pages.crypt.rsa.keySize')"
                                density="compact" hide-details style="min-width: 0;" />
                        </div>

                        <VBtn color="primary" @click="generateKeys" :disabled="isWorking" role="button">
                            <i class='bx bx-key me-2'></i>
                            {{ t('pages.crypt.rsa.generateKeys') }}
                        </VBtn>
                    </VCol>
                </VRow>
                <VRow>
                    <VCol cols="12">
                        <h3 class="mb-3">Plaintext</h3>
                        <textarea v-model="decryptedText" class="w-100" rows="5" :disabled="isWorking"></textarea>
                        <VBtn color="primary" @click="encryptUsingPublicKey" :disabled="isWorking" role="button"
                            class="mt-2">
                            {{ t('pages.crypt.rsa.encrypt') }}
                        </VBtn>
                    </VCol>
                    <VCol cols="12">
                        <h3 class="mb-3">{{ t('pages.crypt.rsa.encryptedText') }}</h3>
                        <textarea v-model="encryptedText" class="w-100" rows="5" :disabled="isWorking"></textarea>
                        <VBtn color="primary" @click="decryptUsingPrivateKey" :disabled="isWorking" role="button"
                            class="mt-2">
                            {{ t('pages.crypt.rsa.decrypt') }}
                        </VBtn>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
        <div class="text-secondary mt-2">
            <small>Powered by web crypto</small>
        </div>
    </div>
</template>
<style scoped>
textarea {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-size: 16px;
    width: 100%;
    font-family: monospace;
}

div :deep(span.v-btn__content) {
    text-transform: none;
}
</style>
