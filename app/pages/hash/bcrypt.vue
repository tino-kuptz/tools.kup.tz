<script setup>
import bcrypt from 'bcryptjs';
import { ref, watch } from 'vue';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.hash.bcrypt.title'),
    meta: [
        {
            description: t('pages.hash.bcrypt.description'),
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
        $toast.success(t('pages.hash.bcrypt.copySuccess'), {
            position: "bottom-center",
        });
    }).catch(err => {
        $toast.error(t('pages.hash.bcrypt.copyError') + ':\n' + err.message, {
            position: "bottom-center",
        });
    });
};

const checkingPassword = ref('');
const checkingHash = ref(null);
const checkingState = ref('initial');

watch(checkingHash, () => checkingState.value = 'initial');
watch(checkingPassword, () => checkingState.value = 'initial');

const checkHash = () => {
    if (checkingState.value == 'loading') {
        return;
    }

    checkingState.value = 'loading';
    const checking = {
        password: checkingPassword.value,
        hash: checkingHash.value,
    };
    bcrypt.compare(checkingPassword.value, checkingHash.value).then((result) => {
        if (checking.hash != checkingHash.value || checking.password != checkingPassword.value) {
            // Textfelder oben wurden geändert, also nicht weiter machen
            return;
        }
        if (result) {
            checkingState.value = 'correct';
        } else {
            checkingState.value = 'wrong';
        }
    }).catch(() => {
        checkingState.value = 'wrong';
    });
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.hash.bcrypt.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.hash.bcrypt.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('common.privacy.noNetworkOrDevice') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VRow>
            <VCol cols="12" md="6">
                <VCard>
                    <VCardTitle>
                        <h2 class="mt-4 ml-2 mb-4">{{ t('pages.hash.bcrypt.createHash') }}</h2>
                    </VCardTitle>
                    <VCardText class="p-2">
                        <h3 class="mb-3">{{ t('pages.hash.bcrypt.text') }}</h3>
                        <textarea v-model="inputText" class="w-100"
                            :placeholder="t('pages.hash.bcrypt.textPlaceholder')" rows="5"></textarea>
                        <h3 class="mb-3 pt-2">{{ t('pages.hash.bcrypt.rounds') }}</h3>

                        <VTextField v-model="rounds" class="w-100" :label="t('pages.hash.bcrypt.roundsLabel')"
                            :placeholder="t('pages.hash.bcrypt.roundsPlaceholder')"
                            :disabled="checkingState === 'loading'" type="number" min="1" />
                    </VCardText>
                    <VCardText>
                        <h3 class="mb-3 pt-2">{{ t('pages.hash.bcrypt.hashLabel') }}</h3>
                        <input v-model="outputText" class="w-100" :placeholder="t('pages.hash.bcrypt.hashPlaceholder')"
                            rows="1" disabled />
                        <div v-if="isHashing" class="pt-2">
                            <small class="text-secondary">
                                <i class='bx bx-loader bx-spin'></i>
                                {{ t('pages.hash.bcrypt.generating') }}
                            </small>
                        </div>
                        <div class="text-end">
                            <v-btn class="mt-2" color="primary" @click="copyToClipboard" :disabled="outputText === ''"
                                role="button">
                                <i class='bx bx-copy me-2'></i>
                                {{ t('pages.hash.bcrypt.clipboard') }}
                            </v-btn>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
            <VCol cols="12" md="6">
                <VCard class="h-100">
                    <VCardTitle>
                        <h2 class="mt-4 ml-2 mb-4">{{ t('pages.hash.bcrypt.checkHash') }}</h2>
                    </VCardTitle>
                    <VCardText class="p-2 mb-auto">
                        <h3 class="mb-3">{{ t('pages.hash.bcrypt.password') }}</h3>
                        <textarea v-model="checkingPassword" class="w-100"
                            :placeholder="t('pages.hash.bcrypt.passwordPlaceholder')" rows="5"
                            :disabled="checkingState === 'loading'"></textarea>
                        <h3 class="mb-3 pt-2">{{ t('pages.hash.bcrypt.hashLabel') }}</h3>
                        <VTextField v-model="checkingHash" class="w-100" :label="t('pages.hash.bcrypt.hashInputLabel')"
                            :placeholder="t('pages.hash.bcrypt.hashInputPlaceholder')"
                            :disabled="checkingState === 'loading'" />

                        <div :class="{ 'invisible': checkingState === 'initial' }">
                            <h3 class="mb-3 pt-4">{{ t('pages.hash.bcrypt.result') }}</h3>
                            <p class="mb-0" v-if="checkingState === 'loading'">
                                <i class='bx bx-loader bx-spin'></i>
                                {{ t('pages.hash.bcrypt.validating') }}
                            </p>
                            <p class="mb-0" v-else-if="checkingState === 'correct'">
                                <i class="bx bx-check text-success me-2"></i>
                                {{ t('pages.hash.bcrypt.correct') }}
                            </p>
                            <p class="mb-0 " v-else-if="checkingState === 'wrong'">
                                <i class="bx bx-error text-error me-2"></i>
                                {{ t('pages.hash.bcrypt.wrong') }}
                            </p>
                            <p class="mb-0 " v-else>
                                <i class="bx bx-error text-error me-2"></i>
                                {{ t('pages.hash.bcrypt.pleaseCheck') }}
                            </p>
                        </div>
                    </VCardText>
                    <VCardText>
                        <div class="text-start">
                            <v-btn color="primary" @click="checkHash" role="button"
                                :disabled="checkingState === 'loading'">
                                {{ t('pages.hash.bcrypt.checkButton') }}
                            </v-btn>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
        </VRow>
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

.invisible {
    visibility: hidden;
}
</style>
