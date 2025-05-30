<script setup>
import { ref, watch } from 'vue';

useHead({
    title: 'Progress bar Generator',
    meta: [
        {
            description: 'Fortschrittsbalken via URL generieren, nutzbar z.B. in Markdown.',
        },
    ],
});

const percentage = ref(80);
const type = ref('svg');

const { data: defaultData } = await useFetch(`/image/progress-bar/generate/0?printParameters=true`);
const currentData = ref({
    width: 200,
    height: 20,
    backgroundColor: '#333',
    barColorOk: '#0d6efd',
    barColorWarn: '#ffc107',
    barColorError: '#dc3545',
    thresholdWarn: 60,
    thresholdError: 20,
    textColor: '#ffffff',
    textSize: 14,
    borderWidth: 0,
})
const resetData = () => {
    if (defaultData.value == null)
        return;
    currentData.value = JSON.parse(JSON.stringify(defaultData.value.parameters));
};
watch(defaultData, resetData);

const { $toast } = useNuxtApp();

const changedParameters = computed(() => {
    if (defaultData.value == null || currentData.value == null)
        return {};
    return Object.keys(currentData.value).reduce((acc, key) => {
        if (currentData.value[key] !== defaultData.value.parameters[key]) {
            acc[key] = currentData.value[key];
        }
        return acc;
    }, {});
});

const copyToClipboard = (data) => {
    navigator.clipboard.writeText(data).then(() => {
        $toast.success('Wurde in die Zwischenablage kopiert', {
            position: "bottom-center",
        });
    }).catch(err => {
        $toast.error('Fehler beim Kopieren:\n' + err.message, {
            position: "bottom-center",
        });
    });
};

const outputUrl = computed(() => {
    var params = new URLSearchParams({
        ...changedParameters.value,
    });
    let paramString = params.toString();
    if (paramString.length >= 1) {
        paramString = '?' + paramString;
    }
    const origin = window ? window.location.origin : 'https://tools.kup.tz'
    return `${origin}/image/progress-bar/generate/${percentage.value}.${type.value}${paramString}`;
});

const svgGraphic = computed(() => {
    const parameters = JSON.parse(JSON.stringify(currentData.value));
    const percent = percentage.value * 1;

    const barWidth = Math.round((parameters.width - (parameters.borderWidth * 2)) * (percent / 100));
    let barColor = parameters.barColorOk;
    if (percent < parameters.thresholdError) {
        barColor = parameters.barColorError;
    } else if (percent < parameters.thresholdWarn) {
        barColor = parameters.barColorWarn;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${parameters.width}" height="${parameters.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${parameters.width}" height="${parameters.height}" rx="${parameters.height / 2}" fill="${parameters.backgroundColor}" />
      <rect x="${parameters.borderWidth}" y="${parameters.borderWidth}" width="${barWidth}" height="${parameters.height - (parameters.borderWidth * 2)}" rx="${(parameters.height - (parameters.borderWidth * 2)) / 2}" fill="${barColor}" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${parameters.textColor}" font-size="${parameters.textSize}" font-family="Arial, sans-serif">${percent}%</text>
    </svg>
    `.toString();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
});
</script>
<template>
    <div>
        <h2 class="mb-2">Progress bar generator</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kann eine URL für einen Fortschrittsbalken generiert werden, der in Markdown
                        oder HTML verwendet werden kann.
                    </div>
                    <div class="text-h6 mb-1">
                        Der Fortschrittbalken wird als SVG generiert und kann in verschiedenen Größen und Farben
                        angepasst werden.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VRow>
            <VCol cols="12" md="6">
                <VCard>
                    <VCardTitle>
                        <h2 class="mt-4 ml-2 mb-4">Eigenschaften</h2>
                    </VCardTitle>
                    <VCardText class="p-2">
                        <VRow>
                            <VCol cols="12" lg="8">
                                <VSlider v-model="percentage" :min="0" :max="100" step="1" label="Prozent (%)"
                                    thumb-label class="mt-2" />
                            </VCol>
                            <VCol cols="12" lg="4">
                                <VSelect v-model="type" :items="['svg']" label="Typ" item-title="type" item-value="type"
                                    disabled="" />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model.number="currentData.width" label="Breite (px)" type="number"
                                    min="50" max="1000" />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model.number="currentData.height" label="Höhe (px)" type="number" min="15"
                                    max="50" />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model="currentData.backgroundColor" label="Hintergrundfarbe" type="color"
                                    hide-details />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model="currentData.textColor" label="Textfarbe" type="color"
                                    hide-details />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model.number="currentData.textSize" label="Textgröße (px)" type="number"
                                    min="10" max="30" />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model="currentData.barColorOk" label="Balkenfarbe (OK)" type="color"
                                    hide-details />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model="currentData.barColorWarn" label="Balkenfarbe (Warnung)"
                                    type="color" hide-details />
                            </VCol>
                            <VCol cols="12" lg="6">
                                <VTextField v-model="currentData.barColorError" label="Balkenfarbe (Fehler)"
                                    type="color" hide-details />
                            </VCol>
                            <VCol cols="12" lg="4">
                                <VTextField v-model.number="currentData.thresholdWarn" label="Warnung ab (%)"
                                    type="number" min="0" max="100" />
                            </VCol>
                            <VCol cols="12" lg="4">
                                <VTextField v-model.number="currentData.thresholdError" label="Fehler ab (%)"
                                    type="number" min="0" max="100" />
                            </VCol>
                            <VCol cols="12" lg="4">
                                <VTextField v-model.number="currentData.borderWidth" label="Rahmenbreite (px)"
                                    type="number" min="0" />
                            </VCol>
                            <VCol cols="12">
                                <v-btn color="secondary" @click="resetData" class="mt-2">
                                    Zurücksetzen
                                </v-btn>
                            </VCol>
                        </VRow>
                    </VCardText>
                </VCard>
            </VCol>
            <VCol cols="12" md="6">
                <VCard class="h-100">
                    <VCardTitle>
                        <h2 class="mt-4 ml-2 mb-4">Ausgabe</h2>
                    </VCardTitle>
                    <VCardText class="p-2 mb-auto">
                        <h3 class="pb-2">Ansicht</h3>
                        <img :src="svgGraphic" alt="Fortschrittsbalken" />
                        <small><br>(im Browser gerendert)</small>
                        <h3 class="pt-5 pb-3">
                            Base64 URL
                            <small class="ps-3">(funktioniert ohne tools.kup.tz)</small>
                        </h3>
                        <VTextField v-model="svgGraphic" label="Generierte URL" readonly />
                        <small>
                            (für embedding, bspw. <code>&lt;img src="..." alt="{{ percentage }}%" /&gt;</code>)
                        </small>
                        <div class="text-start mb-2">
                            <v-btn color="primary" @click="copyToClipboard(svgGraphic)" class="mt-2" size="small">
                                Zwischenablage
                            </v-btn>
                        </div>
                        <h3 class="pt-5 pb-3">URL</h3>
                        <VTextField v-model="outputUrl" label="Generierte URL" readonly />
                        <small>(für Einbindung via URL)</small>
                        <div class="text-start">
                            <v-btn color="primary" @click="copyToClipboard(outputUrl)" class="mt-2 btn-sm" size="small">
                                Zwischenablage
                            </v-btn>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
        </VRow>
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
