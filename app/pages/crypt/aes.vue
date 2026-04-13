<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.crypt.aes.title'),
    meta: [
        {
            description: t('pages.crypt.aes.description'),
        },
    ],
})

const { $toast } = useNuxtApp()

const aesPassword = ref('');
const aesIv = ref('');
const isWorking = ref(false);

const encryptedText = ref('');
const decryptedText = ref('');

const generateKey = async (length) => {
    isWorking.value = true;
    try {
        const key = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: length,
            },
            true,
            ["encrypt", "decrypt"]
        );

        const exportedKey = await window.crypto.subtle.exportKey("raw", key);
        aesPassword.value = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
        aesIv.value = btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(12))));

        $toast.success(t('pages.crypt.aes.generateSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error(t('pages.crypt.aes.generateError'), {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

const getKeySize = () => {
    if (!aesPassword.value) {
        return null;
    }


    try {
        const keyLength = atob(aesPassword.value).length;

        if (keyLength === 16) {
            return 128;
        } else if (keyLength === 24) {
            return 192;
        } else if (keyLength === 32) {
            return 256;
        }
    } catch (error) {
        console.error(error);
    }
    return null;
};

const encrypt = async () => {
    isWorking.value = true;
    try {
        const key = await window.crypto.subtle.importKey(
            "raw",
            Uint8Array.from(atob(aesPassword.value), c => c.charCodeAt(0)),
            {
                name: "AES-GCM",
            },
            false,
            ["encrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV
        aesIv.value = btoa(String.fromCharCode(...iv)); // Store the IV for later use
        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            new TextEncoder().encode(decryptedText.value)
        );

        encryptedText.value = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));

        $toast.success(t('pages.crypt.aes.encryptSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error(t('pages.crypt.aes.encryptError'), {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};
const decrypt = async () => {
    isWorking.value = true;
    try {
        const key = await window.crypto.subtle.importKey(
            "raw",
            Uint8Array.from(atob(aesPassword.value), c => c.charCodeAt(0)),
            {
                name: "AES-GCM",
            },
            false,
            ["decrypt"]
        );

        const iv = Uint8Array.from(atob(aesIv.value), c => c.charCodeAt(0));

        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            Uint8Array.from(atob(encryptedText.value), c => c.charCodeAt(0))
        );

        decryptedText.value = new TextDecoder().decode(decryptedData);

        $toast.success(t('pages.crypt.aes.decryptSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error(t('pages.crypt.aes.decryptError'), {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.crypt.aes.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.aes.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.aes.descriptionPrivacy') }}
                    </div>
                    <div class="text-h6 mb-1 text-muted">
                        {{ t('pages.crypt.aes.descriptionNote') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.aes.key') }}</h3>
                        <VTextField v-model="aesPassword" class="w-100" :label="t('pages.crypt.aes.keyLabel')"
                            :placeholder="t('pages.crypt.aes.keyPlaceholder')" :disabled="isLoading" />
                        <small class="text-muted" v-if="getKeySize()">{{ getKeySize() }} {{
                            t('pages.crypt.aes.keySizeNote') }}</small>
                        <small class="text-muted" v-else>{{ t('pages.crypt.aes.keyUsageNote') }}</small>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.aes.iv') }}</h3>
                        <VTextField v-model="aesIv" class="w-100" :label="t('pages.crypt.aes.ivLabel')"
                            :placeholder="t('pages.crypt.aes.ivPlaceholder')" :disabled="isLoading" />
                        <small class="text-muted">{{ t('pages.crypt.aes.ivTransmitted') }}</small>
                    </VCol>
                    <VCol cols="12">
                        <v-menu>
                            <template v-slot:activator="{ props }">
                                <v-btn color="primary" v-bind="props">
                                    <i class='bx bx-key me-2'></i>
                                    {{ t('pages.crypt.aes.generateKey') }}
                                </v-btn>
                            </template>
                            <v-list>
                                <v-list-item @click="generateKey(128)">
                                    <v-list-item-title>128 Bit</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="generateKey(256)">
                                    <v-list-item-title>256 Bit</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </VCol>
                </VRow>
                <VRow>
                    <VCol cols="12">
                        <h3 class="mb-3">Plaintext</h3>
                        <textarea v-model="decryptedText" class="w-100" rows="5" :disabled="isWorking"></textarea>
                        <VBtn color="primary" @click="encrypt" :disabled="isWorking" role="button" class="mt-2">
                            {{ t('pages.crypt.aes.encrypt') }}
                        </VBtn>
                    </VCol>
                    <VCol cols="12">
                        <h3 class="mb-3">{{ t('pages.crypt.aes.encryptedText') }}</h3>
                        <textarea v-model="encryptedText" class="w-100" rows="5" :disabled="isWorking"></textarea>
                        <VBtn color="primary" @click="decrypt" :disabled="isWorking" role="button" class="mt-2">
                            {{ t('pages.crypt.aes.decrypt') }}
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
}

div :deep(span.v-btn__content) {
    text-transform: none;
}
</style>
