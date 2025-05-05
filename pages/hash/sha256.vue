<script setup>
import { ref, watch } from 'vue';

useHead({
    title: 'SHA-256 Hash Generator',
    meta: [
        {
            description: 'Online mal schnell einen SHA-256 Hash von einem Text oder einer Datei generieren.',
        },
    ],
});

const initialValue = 'test';
const inputType = ref('text');
const inputText = ref(initialValue);
const outputText = ref('');
onMounted(async () => {
    outputText.value = await generateSHA256(initialValue);
});

const generateSHA256 = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const updateHash = async () => {
    if (inputType.value === 'text') {
        outputText.value = await generateSHA256(inputText.value);
    }
};

watch(inputText, updateHash);

const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            outputText.value = hashHex;
        };
        reader.readAsArrayBuffer(file);
    }
};

const { $toast } = useNuxtApp();
const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText.value).then(() => {
        $toast.success('SHA-256-Hash wurde in die Zwischenablage kopiert', {
            position: "bottom-center",
        });
    }).catch(err => {
        $toast.error('Fehler beim Kopieren:\n' + err.message, {
            position: "bottom-center",
        });
    });
};

watch(inputType, async (newValue) => {
    if (newValue === 'text') {
        inputText.value = initialValue;
        outputText.value = await generateSHA256(initialValue);
    } else {
        inputText.value = '';
        outputText.value = '';
    }
});
</script>
<template>
    <div>
        <h2 class="mb-2">SHA-256 Hash Generator</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kann ein SHA-256-Hash von einem Text oder einer Datei generiert werden.
                    </div>
                    <div class="text-h6 mb-1">
                        Der Hash wird im Browser generiert, der eingegebene Text oder die ausgewählte Datei wird nicht
                        via Netzwerk an andere Geräte übertragen.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2" v-if="inputType === 'text'">
                <h3 class="mb-3">Text</h3>
                <textarea v-model="inputText" class="w-100" placeholder="Zu hashender Text" rows="5"></textarea>
                <div class="pt-3">
                    <v-btn color="primary" @click="inputType = 'file'" role="button">
                        Stattdessen eine Datei hashen
                    </v-btn>
                </div>
            </VCardText>
            <VCardText class="p-2" v-else>
                <h3 class="mb-3">Datei</h3>
                <input type="file" @change="onFileChange" class="w-100" />
                <div class="pt-3">
                    <v-btn color="primary" @click="inputType = 'text'" role="button">
                        Stattdessen einen Text hashen
                    </v-btn>
                </div>
            </VCardText>

            <VCardText>
                <h3 class="mb-3">SHA-256 Hash</h3>
                <input v-model="outputText" class="w-100" placeholder="SHA-256 Hash" rows="1" disabled />
                <div class="text-end">
                    <v-btn class="mt-2" color="primary" @click="copyToClipboard" :disabled="outputText === ''"
                        role="button">
                        <i class='bx bx-copy me-2'></i>
                        Zwischenablage
                    </v-btn>
                </div>
            </VCardText>
        </VCard>
        <div class="text-secondary mt-2">
            <small>Powered by web crypto api</small>
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
