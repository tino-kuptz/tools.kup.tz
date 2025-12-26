<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.formatting.html2markdown.title'),
    meta: [
        {
            description: t('pages.formatting.html2markdown.description'),
        },
    ],
})

const htmlInput = ref('<h1>Hello World</h1>\n<p>This is a <strong>paragraph</strong> with <em>formatting</em>.</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>');
const markdownOutput = ref('');
const isWorking = ref(false);

let turndownService = null;

onMounted(() => {
    // Import turndown only on client side
    import('turndown').then((module) => {
        const TurndownService = module.default;
        turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
        });
        // Convert initial HTML if present
        if (htmlInput.value) {
            convert();
        }
    });
});

const { $toast } = useNuxtApp();

const convert = () => {
    if (!turndownService) {
        $toast.error(t('pages.formatting.html2markdown.notReady'), {
            position: "bottom-center",
        });
        return;
    }

    isWorking.value = true;
    try {
        if (!htmlInput.value || htmlInput.value.trim() === '') {
            markdownOutput.value = '';
            return;
        }
        markdownOutput.value = turndownService.turndown(htmlInput.value);
    } catch (error) {
        $toast.error(t('pages.formatting.html2markdown.convertError') + ':\n' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

const copyToClipboard = () => {
    if (!markdownOutput.value) {
        return;
    }
    navigator.clipboard.writeText(markdownOutput.value).then(() => {
        $toast.success(t('pages.formatting.html2markdown.copySuccess'), {
            position: "bottom-center",
        });
    }).catch(err => {
        $toast.error(t('pages.formatting.html2markdown.copyError') + ':\n' + err.message, {
            position: "bottom-center",
        });
    });
};

const clearAll = () => {
    htmlInput.value = '';
    markdownOutput.value = '';
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.formatting.html2markdown.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.formatting.html2markdown.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.formatting.html2markdown.descriptionPrivacy') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3 align-center">
                            <h3 class="mb-0 flex-fill">{{ t('pages.formatting.html2markdown.htmlInput') }}</h3>
                            <VBtn @click="clearAll" color="secondary" size="small" variant="text" :disabled="isWorking">
                                <i class="bx bx-x me-2"></i> {{ t('pages.formatting.html2markdown.clear') }}
                            </VBtn>
                        </div>
                        <textarea 
                            v-model="htmlInput" 
                            class="w-100"
                            :placeholder="t('pages.formatting.html2markdown.htmlPlaceholder')" 
                            rows="15"
                            :disabled="isWorking"
                            @input="convert"
                        ></textarea>
                    </VCol>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3 align-center">
                            <h3 class="mb-0 flex-fill">{{ t('pages.formatting.html2markdown.markdownOutput') }}</h3>
                            <VBtn 
                                @click="copyToClipboard" 
                                color="primary" 
                                size="small" 
                                :disabled="isWorking || !markdownOutput"
                            >
                                <i class="bx bx-copy me-2"></i> {{ t('pages.formatting.html2markdown.copy') }}
                            </VBtn>
                        </div>
                        <textarea 
                            v-model="markdownOutput" 
                            class="w-100"
                            :placeholder="t('pages.formatting.html2markdown.markdownPlaceholder')" 
                            rows="15"
                            :disabled="true"
                        ></textarea>
                    </VCol>
                </VRow>
                <VRow class="mt-2">
                    <VCol cols="12">
                        <VBtn 
                            @click="convert" 
                            color="primary" 
                            :disabled="isWorking" 
                            class="w-100"
                        >
                            <i class="bx bx-transfer-alt me-2"></i> 
                            {{ t('pages.formatting.html2markdown.convertButton') }}
                        </VBtn>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
    </div>
</template>
<style scoped>
textarea {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-size: 16px;
    width: 100%;
    font-family: monospace, monospace;
    resize: vertical;
}

div :deep(span.v-btn__content) {
    text-transform: none;
}
</style>

