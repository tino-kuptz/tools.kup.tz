<script setup>
import { onUnmounted, ref, watch } from 'vue';

useHead({
    title: 'PNG zu ICO',
    meta: [
        {
            description: 'Konvertiert PNG-Bilder zu ICO-Format mit verschiedenen Auflösungen.',
        },
    ],
});

const { $toast } = useNuxtApp();

const selectedFile = ref(null);
const convertedImages = ref([]);
const isConverting = ref(false);

const resolutions = ref([
    { size: 16, label: '16x16', checked: false },
    { size: 32, label: '32x32', checked: false },
    { size: 48, label: '48x48', checked: true, note: '(Google)' },
    { size: 120, label: '120x120', checked: false, note: '(Apple iPhone legacy)' },
    { size: 152, label: '152x152', checked: false, note: '(Apple iPad legacy)' },
    { size: 167, label: '167x167', checked: false, note: '(Apple iPad)' },
    { size: 180, label: '180x180', checked: false, note: '(Apple iPhone)' },
    { size: 192, label: '192x192', checked: true, note: '(Android Home Screen)' },
    { size: 256, label: '256x256', checked: true },
    { size: 512, label: '512x512', checked: false, note: '(Experimentell - ICO unterstützt diese Auflösung eigentlich nicht)' },
]);

watch(selectedFile, (newFile) => {
    if (newFile) {
        if (!newFile.type.startsWith('image/')) {
            $toast.error('Bitte wählen Sie eine Bilddatei aus', {
                position: "bottom-center",
            });
            selectedFile.value = null;
            return;
        }
        convertedImages.value = [];
    }
});

const resizeImage = (file, width, height) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Use high-quality image scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Fehler beim Erstellen des Bildes'));
                    }
                }, 'image/png');
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const blobToArrayBuffer = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
};

const pngToIcoEntry = async (pngBlob, size) => {
    const arrayBuffer = await blobToArrayBuffer(pngBlob);
    const pngData = new Uint8Array(arrayBuffer);

    // ICO entry structure: 16 bytes
    const entry = new Uint8Array(16);

    // Width (1 byte, 0 = 256)
    entry[0] = size === 256 ? 0 : size;
    // Height (1 byte, 0 = 256)
    entry[1] = size === 256 ? 0 : size;
    // Color palette (1 byte, 0 = no palette)
    entry[2] = 0;
    // Reserved (1 byte)
    entry[3] = 0;
    // Color planes (2 bytes, little-endian)
    entry[4] = 1;
    entry[5] = 0;
    // Bits per pixel (2 bytes, little-endian, 32 for RGBA)
    entry[6] = 32;
    entry[7] = 0;
    // Size of image data (4 bytes, little-endian)
    const sizeBytes = new Uint32Array([pngData.length]);
    entry[8] = sizeBytes[0] & 0xFF;
    entry[9] = (sizeBytes[0] >> 8) & 0xFF;
    entry[10] = (sizeBytes[0] >> 16) & 0xFF;
    entry[11] = (sizeBytes[0] >> 24) & 0xFF;
    // Offset of image data (4 bytes, little-endian, will be set later)
    entry[12] = 0;
    entry[13] = 0;
    entry[14] = 0;
    entry[15] = 0;

    return { entry, pngData };
};

const createIcoFile = async (images) => {
    if (images.length === 0) {
        throw new Error('Keine Bilder zum Konvertieren');
    }

    // Calculate header size: 6 bytes (ICO header) + 16 bytes per entry
    const headerSize = 6;
    const entrySize = 16;
    const totalEntries = images.length;

    // Calculate offsets for each image
    let currentOffset = headerSize + (entrySize * totalEntries);
    const entries = [];
    const imageDataArray = [];

    for (const img of images) {
        const { entry, pngData } = await pngToIcoEntry(img.blob, img.size);

        // Set offset in entry
        const offsetBytes = new Uint32Array([currentOffset]);
        entry[12] = offsetBytes[0] & 0xFF;
        entry[13] = (offsetBytes[0] >> 8) & 0xFF;
        entry[14] = (offsetBytes[0] >> 16) & 0xFF;
        entry[15] = (offsetBytes[0] >> 24) & 0xFF;

        entries.push(entry);
        imageDataArray.push(pngData);
        currentOffset += pngData.length;
    }

    // Create ICO file
    const icoSize = currentOffset;
    const icoData = new Uint8Array(icoSize);

    // Write ICO header (6 bytes)
    // Reserved (2 bytes)
    icoData[0] = 0;
    icoData[1] = 0;
    // Type (2 bytes, 1 = ICO)
    icoData[2] = 1;
    icoData[3] = 0;
    // Number of images (2 bytes, little-endian)
    icoData[4] = totalEntries & 0xFF;
    icoData[5] = (totalEntries >> 8) & 0xFF;

    // Write entries
    let offset = headerSize;
    for (const entry of entries) {
        icoData.set(entry, offset);
        offset += entrySize;
    }

    // Write image data
    for (const pngData of imageDataArray) {
        icoData.set(pngData, offset);
        offset += pngData.length;
    }

    return new Blob([icoData], { type: 'image/x-icon' });
};

const convert = async () => {
    if (!selectedFile.value) {
        $toast.error('Bitte wählen Sie zuerst eine Datei aus', {
            position: "bottom-center",
        });
        return;
    }

    const selectedResolutions = resolutions.value.filter(r => r.checked);
    if (selectedResolutions.length === 0) {
        $toast.error('Bitte wählen Sie mindestens eine Auflösung aus', {
            position: "bottom-center",
        });
        return;
    }

    isConverting.value = true;
    convertedImages.value = [];

    try {
        const images = [];

        for (const res of selectedResolutions) {
            const blob = await resizeImage(selectedFile.value, res.size, res.size);
            const objectUrl = URL.createObjectURL(blob);

            images.push({
                size: res.size,
                label: res.label,
                blob: blob,
                objectUrl: objectUrl,
            });
        }

        convertedImages.value = images;
    } catch (error) {
        $toast.error('Fehler beim Konvertieren: ' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isConverting.value = false;
    }
};

const downloadPng = (image) => {
    const link = document.createElement('a');
    link.href = image.objectUrl;
    link.download = `icon-${image.size}x${image.size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const downloadIco = async () => {
    if (convertedImages.value.length === 0) {
        $toast.error('Keine Bilder zum Download verfügbar', {
            position: "bottom-center",
        });
        return;
    }

    try {
        const icoBlob = await createIcoFile(convertedImages.value);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(icoBlob);
        link.download = 'icon.ico';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up object URL after a delay
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);

        $toast.success('ICO-Datei erfolgreich heruntergeladen', {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error('Fehler beim Erstellen der ICO-Datei: ' + error.message, {
            position: "bottom-center",
        });
    }
};

// Cleanup object URLs when component is unmounted
onUnmounted(() => {
    convertedImages.value.forEach(img => {
        if (img.objectUrl) {
            URL.revokeObjectURL(img.objectUrl);
        }
    });
});
</script>

<template>
    <div>
        <h2 class="mb-2">PNG zu ICO</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-2">
                        Dieses Tool hilft dir, ein PNG-Bild in das ICO-Format zu konvertieren.
                    </div>
                    <div class="text-h6 mb-2">
                        Da es sich bei ICO um ein Container-Format handelt, kannst du ein PNG-Bild vorher in
                        verschiedene Auflösungen konvertieren lassen und dann als eine ICO-Datei herunterladen.
                        Die einzelnen Bilder kannst du natürlich auch separat herunterladen.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Konvertierung wird vollständig im Browser durchgeführt, sodass keine Daten an einen Server
                        gesendet werden. Ich bekomme deine Icons nie zu sehen.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VRow>
            <VCol cols="12" md="6">
                <VCard>
                    <VCardTitle>
                        <h2 class="mt-4 ml-2 mb-4">Einstellungen</h2>
                    </VCardTitle>
                    <VCardText>
                        <div class="mb-4">
                            <h3 class="mb-4">Datei auswählen</h3>
                            <VFileInput v-model="selectedFile" label="PNG-Bild auswählen" accept="image/png" />
                            <small v-if="selectedFile" class="text-disabled">
                                Ausgewählt: {{ selectedFile.name }}
                            </small>
                        </div>

                        <div class="mb-4">
                            <h3 class="mb-3">Auflösungen auswählen</h3>
                            <div v-for="res in resolutions" :key="res.size" class="mb-2">
                                <VCheckbox v-model="res.checked"
                                    :label="`${res.label}${res.note ? ' ' + res.note : ''}`" color="primary" />
                            </div>
                        </div>

                        <VBtn color="primary" size="large" block :disabled="!selectedFile || isConverting"
                            :loading="isConverting" @click="convert">
                            <VIcon icon="bx-refresh" class="me-2" />
                            Konvertieren
                        </VBtn>
                    </VCardText>
                </VCard>
            </VCol>

            <VCol cols="12" md="6">
                <VCard v-if="convertedImages.length > 0">
                    <VCardTitle>
                        <h2 class="mt-4 ml-2 mb-2">Konvertierte Bilder</h2>
                        <p class="ms-2 text-h6 mb-4">Den vollständigen ICO-Container kannst du am Ende dieser Box
                            herunterladen.</p>
                    </VCardTitle>
                    <VCardText>
                        <VRow>
                            <VCol v-for="image in convertedImages" :key="image.size" cols="6" sm="4" md="6" lg="4">
                                <VCard variant="outlined" class="text-center">
                                    <VCardText>
                                        <img :src="image.objectUrl" :alt="`${image.label} Icon`"
                                            class="converted-image mb-2" />
                                        <div class="text-caption mb-2">{{ image.label }}</div>
                                        <VBtn color="primary" size="small" block @click="downloadPng(image)">
                                            <VIcon icon="bx-download" class="me-1" size="small" />
                                            PNG
                                        </VBtn>
                                    </VCardText>
                                </VCard>
                            </VCol>
                        </VRow>

                        <VBtn color="success" size="large" block class="mt-4" @click="downloadIco">
                            <VIcon icon="bx-download" class="me-2" />
                            ICO-Container herunterladen
                        </VBtn>
                    </VCardText>
                </VCard>
            </VCol>
        </VRow>
    </div>
</template>

<style scoped>
.converted-image {
    max-width: 100%;
    max-height: 150px;
    width: auto;
    height: auto;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    padding: 4px;
}

div :deep(span.v-btn__content) {
    text-transform: none;
}
</style>
