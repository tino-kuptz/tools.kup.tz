<script setup>
import CryptoJS from 'crypto-js';
import md5 from 'md5';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.hash.md5.title'),
    meta: [
        {
            description: t('pages.hash.md5.description'),
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
        $toast.success(t('pages.hash.md5.copySuccess'), {
            position: "bottom-center",
        })
    }).catch(err => {
        $toast.error(t('pages.hash.md5.copyError') + ':\n' + err.message, {
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
        <h2 class="mb-2">{{ t('pages.hash.md5.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.hash.md5.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.hash.md5.descriptionPrivacy') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2" v-if="inputType === 'text'">
                <h3 class="mb-3">{{ t('pages.hash.md5.text') }}</h3>
                <textarea v-model="inputText" class="w-100" :placeholder="t('pages.hash.md5.textPlaceholder')"
                    rows="5"></textarea>
                <div class="pt-3">
                    <v-btn color="primary" @click="inputType = 'file'" role="button">
                        {{ t('pages.hash.md5.switchToFile') }}
                    </v-btn>
                </div>
            </VCardText>
            <VCardText class="p-2" v-else>
                <h3 class="mb-3">{{ t('pages.hash.md5.file') }}</h3>
                <input type="file" @change="onFileChange" class="w-100" />
                <div class="pt-3">
                    <v-btn color="primary" @click="inputType = 'text'" role="button">
                        {{ t('pages.hash.md5.switchToText') }}
                    </v-btn>
                </div>
            </VCardText>

            <VCardText>
                <h3 class="mb-3">{{ t('pages.hash.md5.hashLabel') }}</h3>
                <input v-model="outputText" class="w-100" :placeholder="t('pages.hash.md5.hashPlaceholder')" rows="1"
                    disabled />
                <div class="text-end">
                    <v-btn class="mt-2" color="primary" @click="copyToClipboard" :disabled="outputText === ''"
                        role="button">
                        <i class='bx bx-copy me-2'></i>
                        {{ t('pages.hash.md5.clipboard') }}
                    </v-btn>
                </div>
            </VCardText>
        </VCard>
        <div class="text-secondary mt-2">
            <small>
                Powered by npm package <a href="https://www.npmjs.com/package/md5" target="_blank">md5</a> and
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
