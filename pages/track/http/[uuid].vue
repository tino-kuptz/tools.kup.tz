<script setup>
const { t, locale } = useI18n();

useCustomI18nHead({
    title: t('pages.track.http.title'),
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
        $toast.error(t('pages.track.http.errors.statusError', { message: e.message }), { position: 'bottom-center' });
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
        $toast.success(t('pages.track.http.success.logsLoaded'), { position: 'bottom-center' });
    } catch (e) {
        $toast.error(t('pages.track.http.errors.loadError', { message: e.message }), { position: 'bottom-center' });
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
        $toast.success(t('pages.track.http.success.urlCopied'), { position: 'bottom-center' });
    } catch (e) {
        $toast.error(t('pages.track.http.errors.copyError'), { position: 'bottom-center' });
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
        <h2 class="mb-2">{{ t('pages.track.http.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">{{ t('pages.track.http.about') }}</div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.track.http.description') }}
                    </div>
                    <VTextField class="w-100" :model-value="trackingUrl" readonly variant="outlined" hide-details>
                        <template #append-inner>
                            <VBtn color="primary" variant="tonal" size="small" @click="copyUrl" style="color: white;">
                                {{ t('pages.track.http.copy') }}
                            </VBtn>
                        </template>
                    </VTextField>
                    <div class="text-h6 mb-1">
                        {{ t('pages.track.http.description2') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.track.http.tokenUsage', {
                            tokens: get_tool_by_url('/track/http',
                                locale.value)?.tokens || 0
                        }) }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <div v-if="isLoading" class="px-4">
                    <VProgressCircular indeterminate color="primary" class="me-1" />
                    {{ t('pages.track.http.loading') }}
                </div>

                <div v-else>
                    <div v-if="needsConfirm" class="px-4">
                        <VAlert type="warning" border="start" color="amber" outlined class="mb-3">
                            <div>{{ t('pages.track.http.confirm.message') }}</div>
                        </VAlert>
                        <VBtn color="primary" @click="confirmAndLoad">{{ t('pages.track.http.confirm.button') }}</VBtn>
                    </div>

                    <div v-else>
                        <h3 class="mb-3 px-4">{{ t('pages.track.http.received') }}</h3>
                        <div class="px-4" v-if="logs.length === 0">
                            <em>{{ t('pages.track.http.noLogs') }}</em>
                        </div>
                        <div class="px-4" v-else>
                            <VDataTable :headers="[
                                { title: t('pages.track.http.table.time'), value: 'created_at' },
                                { title: t('pages.track.http.table.method'), value: 'method' },
                                { title: t('pages.track.http.table.url'), value: 'url' },
                                { title: t('pages.track.http.table.ip'), value: 'ip' },
                                { title: t('pages.track.http.table.action'), value: 'actions', sortable: false }
                            ]" :items="logs" class="elevation-1 mb-4">
                                <template #item.url="{ item }">
                                    <code>{{ item.url }}</code>
                                </template>
                                <template #item.actions="{ item }">
                                    <VBtn size="small" variant="text" @click="selectLog(item)">
                                        {{ t('pages.track.http.table.view') }}
                                    </VBtn>
                                </template>
                            </VDataTable>

                            <div class="mb-6" v-if="selectedLog">
                                <h4 class="mb-2">{{ t('pages.track.http.details.title') }}</h4>
                                <VCard class="mb-2">
                                    <VCardText>
                                        <div class="mb-2"><strong>{{ t('pages.track.http.details.time') }}:</strong> {{
                                            selectedLog.created_at }}</div>
                                        <div class="mb-2"><strong>{{ t('pages.track.http.details.method') }}:</strong>
                                            {{
                                                selectedLog.method }}</div>
                                        <div class="mb-2"><strong>{{ t('pages.track.http.details.url') }}:</strong>
                                            <code>{{
                                                selectedLog.url }}</code>
                                        </div>
                                        <div class="mb-2"><strong>{{ t('pages.track.http.details.sourceIp') }}:</strong>
                                            {{
                                                selectedLog.ip }}</div>

                                        <div class="mb-4"><strong>{{ t('pages.track.http.details.headers') }}:</strong>
                                            <VTable density="compact" class="mt-2">
                                                <thead>
                                                    <tr>
                                                        <th>{{ t('pages.track.http.details.header') }}</th>
                                                        <th>{{ t('pages.track.http.details.value') }}</th>
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

                                        <div class="mb-2"><strong>{{ t('pages.track.http.details.content') }}:</strong>
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
