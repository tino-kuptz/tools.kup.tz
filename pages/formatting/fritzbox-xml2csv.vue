<script setup>
import { fritzbox_xml2csv } from '~/utils/fritzbox-xml2csv.js';

useHead({
    title: 'FRITZ!Box xml2csv Konverter',
    meta: [
        {
            description: 'Ein Adressbuch aus der FRITZ!Box im XML-Format zu einer CSV umwandeln.',
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
        $toast.error('Fehler beim Konvertieren zu CSV:\n' + error.message, {
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
        <h2 class="mb-2">FRITZ!Box xml2csv</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Dieses Tool wandelt ein Adressbuch aus der FRITZ!Box im XML-Format in eine CSV-Datei um.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Konvertierung wird im Browser durchgeführt, der eingegebene Text oder die ausgewählte
                        Datei wird nicht via Netzwerk an andere Geräte übertragen.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">Quell-XML
                            </h3>
                            <!-- Damit die einheitlich sind: -->
                            <VSelect style="opacity: 0; pointer-events: none;" />
                        </div>
                        <textarea v-model="sourceXml" class="w-100"
                            placeholder="&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;&lt;phonebooks&gt;&lt;phonebook&gt;...&lt;/phonebook&gt;&lt;/phonebooks&gt;"
                            rows="5" :disabled="isWorking"></textarea>
                    </VCol>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">Konvertiert</h3>
                            <VSelect v-model="seperator" :items="[';', ',', '\\t']" label="Ziel-Trennzeichen"
                                :disabled="isWorking" />
                        </div>
                        <textarea v-model="targetCsv" class="w-100" placeholder="1;2;3;4;5" rows="5"
                            :disabled="true"></textarea>
                        <div class="d-flex justify-end mt-2">
                            <VBtn color="primary" :disabled="!targetCsv || isWorking" @click="downloadAsFile">
                                <span class="v-btn__content">Herunterladen</span>
                            </VBtn>
                        </div>
                    </VCol>
                    <VCol cols="12">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">Formatierung</h3>
                        </div>
                        <VCheckbox v-model="formatNumbers.do" label="Telefonnummern formatieren"
                            :disabled="isWorking" />
                        <small class="text-muted">Rufnummern werden in ein internationales Format umgewandelt</small>
                        <VCheckbox v-model="formatNumbers.doAdvanced" label="Erweitertes Matching aktivieren"
                            :disabled="!formatNumbers.do || isWorking" />
                        <small class="text-muted">Bei Telefonnummer ohne "0" am Anfang wird die Ortsvorwahl gepräfixt,
                            bevor sie
                            geparst wird</small>
                    </VCol>
                    <VCol cols="12" xl="6" class="mb-2">
                        <VTextField v-model="formatNumbers.countryPrefix" label="Ländervorwahl"
                            :disabled="!formatNumbers.do || isWorking" />
                        <small>Zweibuchstabencode für das Standard-Land; bspw. <code>DE</code> = Deutschland</small>
                    </VCol>
                    <VCol cols="12" xl="6" class="mb-2">
                        <VTextField v-model="formatNumbers.areaCode" label="Ortsvorwahl"
                            :disabled="!formatNumbers.do || isWorking" />
                        <small>Mit "0" vorweg; bspw. <code>04321</code> = Neumünster</small>
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
