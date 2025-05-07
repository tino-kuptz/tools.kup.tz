<script setup>
useHead({
    title: 'CSV Konverter',
    meta: [
        {
            description: 'Schnell mal verschiedene CSV Formate konvertieren.',
        },
    ],
})

const { $toast } = useNuxtApp()

const sourceCsv = ref('');
const seperators = ref({
    source: ',',
    target: ';',
})
const targetCsv = ref('');
const isWorking = ref(false);

watch([
    sourceCsv,
    () => seperators.value.source,
    () => seperators.value.target
], () => {
    if (sourceCsv.value) {
        convert();
    }
}, { immediate: true });

const convert = () => {
    isWorking.value = true;
    try {
        const rows = sourceCsv.value.split('\n').map(row => {
            const columns = [];
            let currentColumn = '';
            let insideQuotes = false;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                const nextChar = row[i + 1];

                if (char === '"' && !insideQuotes && (i === 0 || row[i - 1] === (seperators.value.source !== '\\t' ? seperators.value.source : '\t'))) {
                    insideQuotes = true;
                } else if (char === '"' && insideQuotes && (i === row.length - 1 || nextChar === (seperators.value.source !== '\\t' ? seperators.value.source : '\t'))) {
                    insideQuotes = false;
                } else if (char === (seperators.value.source !== '\\t' ? seperators.value.source : '\t') && !insideQuotes) {
                    columns.push(currentColumn);
                    currentColumn = '';
                } else {
                    currentColumn += char;
                }
            }

            columns.push(currentColumn);

            return columns;
        });

        targetCsv.value = rows.map(row => row.map(col => `"${col.replace(/"/g, '""')}"`).join(seperators.value.target !== '\\t' ? seperators.value.target : '\t')).join('\n');
    } catch (error) {
        $toast.error('Fehler beim Konvertieren der CSV:\n' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

</script>
<template>
    <div>
        <h2 class="mb-2">CSV Konverter</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        CSV-Dateien sind i.d.R. mit einem Komma (,) getrennt. In Deutschland ist es jedoch üblich, dass
                        CSV-Dateien mit einem
                        Semikolon (;) getrennt sind. Dieses Tool konvertiert CSV-Dateien von Komma zu Semikolon und
                        umgekehrt.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Konvertierung wird im Browser durchgeführt, der eingegebene Text oder die ausgewählte
                        Datei wird nicht via Netzwerk an andere Geräte übertragen.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Konvertierung ist nur basic, da ich sie nur hin und wieder für Kleinigkeiten brauche. Gibt
                        zum Beispiel kleine Probleme mit Anführungszeichen, die mitten in einer Zeile verwendet werden.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">Quell-CSV</h3>
                            <VSelect v-model="seperators.source" :items="[';', ',', '\\t']" label="Quell-Trennzeichen"
                                :disabled="isWorking" />
                        </div>
                        <textarea v-model="sourceCsv" class="w-100" placeholder="1,2,3,4,5" rows="5"
                            :disabled="isWorking"></textarea>
                    </VCol>
                    <VCol cols="12" xl="6">
                        <div class="d-flex mb-3">
                            <h3 class="mb-0 flex-fill">Konvertiert</h3>
                            <VSelect v-model="seperators.target" :items="[';', ',', '\\t']" label="Ziel-Trennzeichen"
                                :disabled="isWorking" />
                        </div>
                        <textarea v-model="targetCsv" class="w-100" placeholder="1;2;3;4;5" rows="5"
                            :disabled="true"></textarea>
                    </VCol>
                    <!--
                    <VCol cols="12">
                        <VBtn color="primary" @click="convert" :disabled="isWorking" role="button">
                            <i class='bx bx-transfer-alt me-2'></i>
                            Kovertieren
                        </VBtn>
                    </VCol>
                    -->
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
}

div :deep(span.v-btn__content) {
    text-transform: none;
}
</style>
