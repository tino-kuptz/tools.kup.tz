<script setup>

useHead({
    title: 'Bilder zu Base64',
    meta: [
        {
            description: 'Konvertieren eines Bildes zu einem Base64 Bild.',
        },
    ],
})

const outputImages = ref([]);

const elementTemplates = [
    {
        name: 'Bild',
        content: '<img alt="xxx" src="$REPLACE%" />',
    },
    {
        name: 'CSS',
        content: 'background-image: url("$REPLACE%");',
    },
]


const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const base64String = btoa(
                new Uint8Array(arrayBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            const mimeType = file.type;
            outputImages.value.push({
                name: file.name,
                base64: `data:${mimeType};base64,${base64String}`,
            });
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    }
};

const { $toast } = useNuxtApp()
const copyToClipboard = (str) => {
    navigator.clipboard.writeText(str).then(() => {
        $toast.success('Wurde in die Zwischenablage kopiert', {
            position: "bottom-center",
        })
    }).catch(err => {
        $toast.error('Fehler beim Kopieren:\n' + err.message, {
            position: "bottom-center",
        });
    });
};
</script>
<template>
    <div>
        <h2 class="mb-2">Bilder zu Base64</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool können Bilder schnell ins Base64 Format umgewandelt werden. Dies ist nützlich,
                        um
                        Bilder in HTML oder CSS einzubetten, ohne sie extern zu hosten.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Konvertierung wird im Browser durchgeführt, sodass keine Daten an einen Server gesendet
                        werden.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardItem>
                <h3 class="mb-3">Datei</h3>
                <input type="file" @change="onFileChange" class="w-100" />

                <h3 class="mt-3" v-if="outputImages.length > 0">Ergebnisse</h3>

                <div class="mt-2" v-for="(image, index) in outputImages" :key="index">
                    <h4 class="mb-2">{{ image.name }}</h4>

                    <VRow>
                        <VCol cols="12" md="3" class="uploaded-image d-none d-md-block text-center">
                            <img alt="Hochgeladenes Bild" :src="image.base64" />
                        </VCol>
                        <VCol cols="12" md="9">
                            <div v-for="(template, index) in elementTemplates" :key="index">
                                <h5>{{ template.name }}</h5>
                                <pre class="mb-1"
                                    style="overflow-x: scroll;">{{ template.content.replace('$REPLACE%', image.base64) }}</pre>
                                <VBtn @click="copyToClipboard(template.content.replace('$REPLACE%', image.base64))"
                                    color="primary" size="x-small" class="mb-2">
                                    <i class="bx bx-copy me-2"></i> Zwischenablage
                                </VBtn>
                            </div>
                        </VCol>
                    </VRow>
                </div>
            </VCardItem>
        </VCard>
    </div>
</template>
<style scoped>
.uploaded-image img {
    max-width: 100%;
    max-height: 40dvh;
}

div :deep(span.v-btn__content) {
    text-transform: none;
}

pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
}
</style>
