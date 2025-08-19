<script setup>
useHead({
    title: 'HTTP Request Tracker',
});

import { raw_get } from '~/lib/api.js';
import { get_tool_by_url } from '~/utils/toolList.js';

const route = useRoute();
const uuid = computed(() => route.params.uuid + '');
const trackingUrl = computed(() => `https://${uuid.value}.397625878.xyz`);

const isLoading = ref(true);
const needsConfirm = ref(false);
const logs = ref([]);
const selectedLog = ref(null);

const { $toast } = useNuxtApp();

const fetchStatus = async () => {
    isLoading.value = true;
    try {
        const data = await raw_get(`/api/track/http/${uuid.value}`);
        needsConfirm.value = !(data && data.alreadyConsumed === true);
    } catch (e) {
        $toast.error('Fehler beim Prüfen des Status: ' + e.message, { position: 'bottom-center' });
    } finally {
        isLoading.value = false;
    }
};

const confirmAndLoad = async () => {
    isLoading.value = true;
    try {
        const data = await raw_get(`/api/track/http/${uuid.value}`, { confirm: true });
        logs.value = data.logs || [];
        needsConfirm.value = false;
        $toast.success('Logs geladen', { position: 'bottom-center' });
    } catch (e) {
        $toast.error('Fehler beim Laden der Logs: ' + e.message, { position: 'bottom-center' });
    } finally {
        isLoading.value = false;
    }
};

onMounted(async () => {
    await fetchStatus();
    if (!needsConfirm.value) {
        await confirmAndLoad();
    }
});

const pretty = (val) => {
    try { return JSON.stringify(JSON.parse(val), null, 2); } catch { return val; }
};

const copyUrl = async () => {
    try {
        await navigator.clipboard.writeText(trackingUrl.value);
        $toast.success('URL kopiert', { position: 'bottom-center' });
    } catch (e) {
        $toast.error('Konnte URL nicht kopieren', { position: 'bottom-center' });
    }
};

const selectLog = (log) => {
    selectedLog.value = log;
};

const selectedHeaders = computed(() => {
    if (!selectedLog.value) return null;
    try {
        return JSON.parse(selectedLog.value.headers || '{}');
    } catch (e) {
        return null;
    }
});
</script>

<template>
    <div>
        <h2 class="mb-2">HTTP Request Tracker</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">Über dieses Tool</div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kannst du HTTP-Requests protokollieren. Frage mit deiner Anwendung einfach die
                        folgende URL ab:
                    </div>
                    <VTextField class="w-100" :model-value="trackingUrl" readonly variant="outlined" hide-details>
                        <template #append-inner>
                            <VBtn color="primary" variant="tonal" size="small" @click="copyUrl" style="color: white;">
                                Kopieren
                            </VBtn>
                        </template>
                    </VTextField>
                    <div class="text-h6 mb-1">
                        Alle Anfragen zu allen Pfaden der o.g. URL werden dann hier angezeigt. Nach 3-4 Tagen werden
                        hier protokollierte Requests automatisch gelöscht.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Verwendung dieses Tools verbraucht <strong>{{ get_tool_by_url('/track/http').tokens }}
                            Token</strong>.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <div v-if="isLoading" class="px-4">
                    <VProgressCircular indeterminate color="primary" class="me-1" />
                    Lädt…
                </div>

                <div v-else>
                    <div v-if="needsConfirm" class="px-4">
                        <VAlert type="warning" border="start" color="amber" outlined class="mb-3">
                            <div>Für das Anzeigen der Logs werden Token verbraucht. Möchtest du fortfahren?</div>
                        </VAlert>
                        <VBtn color="primary" @click="confirmAndLoad">Token verbrauchen & Logs laden</VBtn>
                    </div>

                    <div v-else>
                        <h3 class="mb-3 px-4">Empfangene Requests</h3>
                        <div class="px-4" v-if="logs.length === 0">
                            <em>Keine Logs vorhanden.</em>
                        </div>
                        <div class="px-4" v-else>
                            <VDataTable :headers="[
                                { title: 'Zeit', value: 'created_at' },
                                { title: 'Methode', value: 'method' },
                                { title: 'URL', value: 'url' },
                                { title: 'IP', value: 'ip' },
                                { title: 'Aktion', value: 'actions', sortable: false }
                            ]" :items="logs" class="elevation-1 mb-4">
                                <template #item.url="{ item }">
                                    <code>{{ item.url }}</code>
                                </template>
                                <template #item.actions="{ item }">
                                    <VBtn size="small" variant="text" @click="selectLog(item)">
                                        Ansehen
                                    </VBtn>
                                </template>
                            </VDataTable>

                            <div class="mb-6" v-if="selectedLog">
                                <h4 class="mb-2">Details</h4>
                                <VCard class="mb-2">
                                    <VCardText>
                                        <div class="mb-2"><strong>Zeit:</strong> {{ selectedLog.created_at }}</div>
                                        <div class="mb-2"><strong>Methode:</strong> {{ selectedLog.method }}</div>
                                        <div class="mb-2"><strong>URL:</strong> <code>{{ selectedLog.url }}</code></div>
                                        <div class="mb-2"><strong>Quell-IP:</strong> {{ selectedLog.ip }}</div>

                                        <div class="mb-4"><strong>Headers:</strong>
                                            <VTable density="compact" class="mt-2">
                                                <thead>
                                                    <tr>
                                                        <th>Header</th>
                                                        <th>Wert</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="(value, key) in selectedHeaders" :key="key">
                                                        <td><code>{{ key }}</code></td>
                                                        <td>{{ value }}</td>
                                                    </tr>
                                                </tbody>
                                            </VTable>
                                        </div>

                                        <div class="mb-2"><strong>Content:</strong>
                                            <pre>{{ selectedLog.body }}</pre>
                                        </div>
                                    </VCardText>
                                </VCard>
                            </div>
                        </div>
                    </div>
                </div>
            </VCardText>
        </VCard>
    </div>
</template>

<style scoped>
pre {
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
