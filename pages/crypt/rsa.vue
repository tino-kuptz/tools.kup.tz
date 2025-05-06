<script setup>

useHead({
    title: 'RSA Crypt online',
    meta: [
        {
            description: 'Schnell mal Daten mit RSA ver- und entschlüsseln.',
        },
    ],
})

const { $toast } = useNuxtApp()

const rsaPublicKey = ref('');
const rsaPrivateKey = ref('');
const isWorking = ref(false);

const encryptedText = ref('');
const decryptedText = ref('');

const generateKeys = async () => {
    isWorking.value = true;
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: { name: "SHA-256" },
            },
            true,
            ["encrypt", "decrypt"]
        );

        rsaPublicKey.value = btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("spki", keyPair.publicKey))));
        rsaPrivateKey.value = btoa(String.fromCharCode(...new Uint8Array(await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey))));

        $toast.success('Schlüssel erfolgreich generiert', {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error('Fehler beim Generieren der Schlüssel', {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

const encryptUsingPublicKey = async () => {
    isWorking.value = true;
    try {
        const privateKey = await window.crypto.subtle.importKey(
            "spki",
            Uint8Array.from(atob(rsaPublicKey.value), c => c.charCodeAt(0)),
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

        $toast.success('Verschlüsselung erfolgreich', {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error('Fehler beim Verschlüsseln', {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};
const decryptUsingPrivateKey = async () => {
    isWorking.value = true;
    try {
        const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            Uint8Array.from(atob(rsaPrivateKey.value), c => c.charCodeAt(0)),
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

        $toast.success('Entschlüsseln erfolgreich', {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error('Fehler beim Entschlüsseln', {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};
</script>
<template>
    <div>
        <h2 class="mb-2">RSA Keygen + Ver-/Entschlüsselung</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool können Online Daten via RSA ver- und entschlüsselt werden.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Verschlüsselung wird im Browser durchgeführt, der eingegebene Text oder die ausgewählte
                        Datei wird nicht
                        via Netzwerk an andere Geräte übertragen.
                    </div>
                    <div class="text-h6 mb-1 text-muted">
                        Genutzt wird RSA-OAEP mit SHA-256er Hash, generiert werden 2018er Schlüssel.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">Öffentlicher Schlüssel</h3>
                        <textarea v-model="rsaPublicKey" class="w-100" placeholder="Öffentlicher Schlüssel" rows="5"
                            :disabled="isWorking"></textarea>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">Privater Schlüssel</h3>
                        <textarea v-model="rsaPrivateKey" class="w-100" placeholder="Privater Schlüssel" rows="5"
                            :disabled="isWorking"></textarea>
                    </VCol>
                    <VCol cols="12">
                        <VBtn color="primary" @click="generateKeys" :disabled="isWorking" role="button">
                            <i class='bx bx-key me-2'></i>
                            Schlüssel generieren
                        </VBtn>
                    </VCol>
                </VRow>
                <VRow>
                    <VCol cols="12">
                        <h3 class="mb-3">Plaintext</h3>
                        <textarea v-model="decryptedText" class="w-100"
                            placeholder="Text, der verschlüsselt werden soll" rows="5" :disabled="isWorking"></textarea>
                        <VBtn color="primary" @click="encryptUsingPublicKey" :disabled="isWorking" role="button"
                            class="mt-2">
                            Verschlüsseln
                        </VBtn>
                    </VCol>
                    <VCol cols="12">
                        <h3 class="mb-3">Verschlüsselter Text</h3>
                        <textarea v-model="encryptedText" class="w-100"
                            placeholder="Text, der verschlüsselt ist und entschlüsselt werden soll" rows="5"
                            :disabled="isWorking"></textarea>
                        <VBtn color="primary" @click="decryptUsingPrivateKey" :disabled="isWorking" role="button"
                            class="mt-2">
                            Entschlüsseln
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
