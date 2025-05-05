<script setup>
import CryptoJS from 'crypto-js';
import md5 from 'md5';

useHead({
    title: 'MD5 Hash Generator',
    meta: [
        {
            description: 'Online mal schnell einen MD5 Hash von einem Text oder einer Datei generieren.',
        },
    ],
})

const initialValue = 'test';
const inputType = ref('text');
const inputText = ref(initialValue);
const outputText = ref(md5(initialValue));

watch(inputText, (newValue) => {
    if (inputType.value === 'file') {
        return;
    }
    outputText.value = md5(newValue);
});

const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
            const hashHex = CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex);
            outputText.value = hashHex;
            outputText.value = hashHex;
        };
        reader.readAsArrayBuffer(file);
    }
};

const { $toast } = useNuxtApp()
const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText.value).then(() => {
        $toast.success('MD5-Hash wurde in die Zwischenablage kopiert', {
            position: "bottom-center",
        })
    }).catch(err => {
        $toast.error('Fehler beim Kopieren:\n' + err.message, {
            position: "bottom-center",
        });
    });
};

watch(inputType, (newValue) => {
    if (newValue === 'text') {
        inputText.value = initialValue;
        outputText.value = md5(initialValue);
    } else {
        inputText.value = '';

        outputText.value = '';
    }
});
</script>
<template>
    <div>
        <h2 class="mb-2">MD5 Hash Generator</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kann ein MD5-Hash von einem Text oder einer Datei generiert werden.
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
                <h3 class="mb-3">MD5 Hash</h3>
                <input v-model="outputText" class="w-100" placeholder="MD5 Hash" rows="1" disabled />
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
            <small>Powered by npm package <a href="https://www.npmjs.com/package/md5" target="_blank">md5</a> and
                <a href="https://www.npmjs.com/package/crypto-js" target="_blank">crypto-js</a></small>
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
