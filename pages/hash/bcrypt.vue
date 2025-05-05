<script setup>
import bcrypt from 'bcryptjs';
import { ref, watch } from 'vue';

useHead({
    title: 'Bcrypt Hash Generator',
    meta: [
        {
            description: 'Online mal schnell einen Bcrypt Hash von einem Text generieren.',
        },
    ],
});

const initialValue = 'test';
const rounds = ref(12);
const inputText = ref(initialValue);
const outputText = ref('');
const isHashing = ref(false);
onMounted(() => {
    updateHash();
});

var timeout = null;
const updateHash = () => {
    if (timeout !== null)
        clearTimeout(timeout);
    isHashing.value = true;
    outputText.value = '';
    timeout = setTimeout(async () => {
        const currentText = inputText.value + "";
        try {
            const currentHash = await bcrypt.hash(inputText.value, rounds.value);
            if (currentText !== inputText.value) {
                return;
            }
            outputText.value = currentHash;
        } finally {
            isHashing.value = false;
        }
    }, 500);
};

watch(inputText, updateHash);
watch(rounds, updateHash);

const { $toast } = useNuxtApp();
const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText.value).then(() => {
        $toast.success('Bcrypt-Hash wurde in die Zwischenablage kopiert', {
            position: "bottom-center",
        });
    }).catch(err => {
        $toast.error('Fehler beim Kopieren:\n' + err.message, {
            position: "bottom-center",
        });
    });
};
</script>
<template>
    <div>
        <h2 class="mb-2">Bcrypt Hash Generator</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kann ein Bcrypt-Hash von einem Text generiert werden.
                    </div>
                    <div class="text-h6 mb-1">
                        Der eingegebene Text sowie der Hash wird im Browser generiert, nichts davon wird
                        via Netzwerk an andere Geräte übertragen oder verlässt das Gerät.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <h3 class="mb-3">Text</h3>
                <textarea v-model="inputText" class="w-100" placeholder="Zu hashender Text" rows="5"></textarea>
                <h3 class="mb-3">Runden</h3>
                <input v-model="rounds" type="number" class="w-100" placeholder="Runden" min="1" />
            </VCardText>

            <VCardText>
                <h3 class="mb-3">Bcrypt Hash</h3>
                <input v-model="outputText" class="w-100" placeholder="Bcrypt Hash" rows="1" disabled />
                <div v-if="isHashing" class="pt-2">
                    <small class="text-secondary">
                        <i class='bx bx-loader bx-spin'></i>
                        Generiere Bcrypt-Hash...
                    </small>
                </div>
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
            <small>Powered by npm package <a href="https://www.npmjs.com/package/bcryptjs">bcrypt.js</a>.</small>
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
