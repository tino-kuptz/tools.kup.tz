<script setup>
import { fritzbox_xml2csv } from '~/utils/fritzbox-xml2csv.js';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.formatting.fritzboxXml2csv.title'),
    meta: [
        {
            description: t('pages.formatting.fritzboxXml2csv.description'),
        },
    ],
})

const { $toast } = useNuxtApp()

const sourceXml = ref('');
const seperator = ref(';')
const targetCsv = ref('');
const isWorking = ref(false);

const formatNumbers = ref({
    do: false,
    doAdvanced: true,
    countryPrefix: 'DE',
    areaCode: '04321',
})

watch([
    sourceXml,
    seperator,
    () => formatNumbers.value.do,
    () => formatNumbers.value.doAdvanced,
    () => formatNumbers.value.countryPrefix,
    () => formatNumbers.value.areaCode
], () => {
    if (sourceXml.value) {
        convert();
    }
}, { immediate: true });

const convert = async () => {
    isWorking.value = true;
    try {
        targetCsv.value = await fritzbox_xml2csv(sourceXml.value, seperator.value, formatNumbers.value);
    } catch (error) {
        targetCsv.value = '';
        $toast.error(t('pages.formatting.fritzboxXml2csv.convertError') + ':\n' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

function downloadAsFile() {
    var textFileAsBlob = new Blob([targetCsv.value], { type: 'text/plain' });
    var aLink = document.createElement("a");
    aLink.download = "fritzbox-adressbuch.csv";
    aLink.innerHTML = "fritzbox-adressbuch.csv";
    aLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    aLink.click();
}
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.formatting.fritzboxXml2csv.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.formatting.fritzboxXml2csv.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.formatting.fritzboxXml2csv.descriptionPrivacy') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">{{ t('pages.formatting.fritzboxXml2csv.sourceXml') }}
                            </h3>
                            <!-- Damit die einheitlich sind: -->
                            <VSelect style="opacity: 0; pointer-events: none;" />
                        </div>
                        <textarea v-model="sourceXml" class="w-100"
                            :placeholder="t('pages.formatting.fritzboxXml2csv.sourcePlaceholder')" rows="5"
                            :disabled="isWorking"></textarea>
                    </VCol>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">{{ t('pages.formatting.fritzboxXml2csv.targetCsv') }}</h3>
                            <VSelect v-model="seperator" :items="[';', ',', '\\t']"
                                :label="t('pages.formatting.fritzboxXml2csv.targetSeparator')" :disabled="isWorking" />
                        </div>
                        <textarea v-model="targetCsv" class="w-100"
                            :placeholder="t('pages.formatting.fritzboxXml2csv.targetPlaceholder')" rows="5"
                            :disabled="true"></textarea>
                        <div class="d-flex justify-end mt-2">
                            <VBtn color="primary" :disabled="!targetCsv || isWorking" @click="downloadAsFile">
                                <span class="v-btn__content">{{ t('pages.formatting.fritzboxXml2csv.download') }}</span>
                            </VBtn>
                        </div>
                    </VCol>
                    <VCol cols="12">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">{{ t('pages.formatting.fritzboxXml2csv.formatting') }}</h3>
                        </div>
                        <VCheckbox v-model="formatNumbers.do"
                            :label="t('pages.formatting.fritzboxXml2csv.formatNumbers')" :disabled="isWorking" />
                        <small class="text-muted">{{ t('pages.formatting.fritzboxXml2csv.formatNumbersDesc') }}</small>
                        <VCheckbox v-model="formatNumbers.doAdvanced"
                            :label="t('pages.formatting.fritzboxXml2csv.advancedMatching')"
                            :disabled="!formatNumbers.do || isWorking" />
                        <small class="text-muted">{{ t('pages.formatting.fritzboxXml2csv.advancedMatchingDesc')
                            }}</small>
                    </VCol>
                    <VCol cols="12" xl="6" class="mb-2">
                        <VTextField v-model="formatNumbers.countryPrefix"
                            :label="t('pages.formatting.fritzboxXml2csv.countryPrefix')"
                            :disabled="!formatNumbers.do || isWorking" />
                        <small v-html="t('pages.formatting.fritzboxXml2csv.countryPrefixDesc')"></small>
                    </VCol>
                    <VCol cols="12" xl="6" class="mb-2">
                        <VTextField v-model="formatNumbers.areaCode"
                            :label="t('pages.formatting.fritzboxXml2csv.areaCode')"
                            :disabled="!formatNumbers.do || isWorking" />
                        <small v-html="t('pages.formatting.fritzboxXml2csv.areaCodeDesc')"></small>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
        <small class="d-block text-muted mt-4">
            Powered by <a href="https://npmjs.org/package/xml2js" target="_blank">xml2js</a>
            und <a href="https://npmjs.org/package/libphonenumber-js" target="_blank">libphonenumber-js</a>
        </small>
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
