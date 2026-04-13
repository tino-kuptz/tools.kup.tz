<script setup>
const { t, locale } = useI18n();

useCustomI18nHead({
    title: t('pages.dns.mx.title'),
    meta: [
        {
            description: t('pages.dns.mx.description'),
        },
    ],
})

import { raw_get } from '~/lib/api.js';

const domain = ref('');
const isLoading = ref(false);
const response = ref(null);

const { $toast } = useNuxtApp()

const isValidDomain = (domain) => {
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
};

const doRequest = async () => {
    if (!domain.value) {
        $toast.error(t('pages.dns.mx.errors.noDomain'), {
            position: "bottom-center",
        })
        return;
    }

    if (!isValidDomain(domain.value)) {
        $toast.error(t('pages.dns.mx.errors.invalidDomain'), {
            position: "bottom-center",
        });
        return;
    }

    isLoading.value = true;
    try {
        const data = await raw_get('/api/dns/mx', { domain: domain.value });
        if (data) {
            response.value = data;

            $toast.success(t('pages.dns.mx.errors.fetchSuccess'), {
                position: "bottom-center",
            })
        } else {
            $toast.error(t('pages.dns.mx.errors.fetchError'), {
                position: "bottom-center",
            })
        }
    } catch (e) {
        $toast.error(t('pages.dns.mx.errors.fetchError') + '\n' + e.message, {
            position: "bottom-center",
        })
    } finally {
        isLoading.value = false;
    }
}
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.dns.mx.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('pages.dns.mx.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.dns.mx.description1') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.dns.mx.description2') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <h3 class="mb-3">{{ t('pages.dns.mx.domain') }}</h3>
                <p>
                    {{ t('pages.dns.mx.domainDescription') }}
                </p>
                <p>
                    {{ t('pages.dns.mx.tokenUsage', { tokens: get_tool_by_url('/dns/mx', locale.value)?.tokens || 0 })
                    }}
                </p>
                <VTextField v-model="domain" class="w-100" :label="t('common.domain')"
                    :placeholder="t('common.placeholder.domain')" :disabled="isLoading" />
                <VBtn color="primary" class="mt-4" :loading="isLoading" @click="doRequest">
                    {{ t('pages.dns.mx.query') }}
                </VBtn>
            </VCardText>
            <VCardText>
                <div v-if="isLoading" class="px-4">
                    <h3 class="mb-3">{{ t('pages.dns.mx.records') }}</h3>

                    <VProgressCircular indeterminate color="primary" class="me-1" />
                    {{ t('pages.dns.mx.loading') }}
                </div>
                <div v-else-if="response" class="text-h6 mb-1">
                    <h3 class="mb-3">{{ t('pages.dns.mx.records') }}</h3>

                    <VAlert v-if="response.suspectedIsp" type="info" border="start" color="green" outlined class="mb-3">
                        <p class="mb-0">{{ t('pages.dns.mx.providerFound', { name: response.suspectedIsp.name }) }}</p>
                    </VAlert>
                    <VAlert v-else type="warning" border="start" color="red" outlined class="mb-3">
                        <p class="mb-0">{{ t('pages.dns.mx.providerNotFound') }}</p>
                    </VAlert>

                    <div>
                        <VDataTable :headers="[
                            { title: t('pages.dns.mx.table.priority'), value: 'priority' },
                            { title: t('pages.dns.mx.table.server'), value: 'exchange' },
                            { title: t('pages.dns.mx.table.ipv4'), value: 'ip4' },
                            { title: t('pages.dns.mx.table.ipv6'), value: 'ip6' }
                        ]" :items="response.mxRecords" item-value="exchange" class="elevation-1">
                            <template #item.ip4="{ item }">
                                <div v-for="ip in item.ip4" :key="ip" class="py-1">{{ ip }}</div>
                                <div class="py-1" v-if="item.ip4.length === 0">-</div>
                            </template>
                            <template #item.exchange="{ item }">
                                <code>{{ item.exchange }}</code>
                            </template>
                            <template #item.ip6="{ item }">
                                <div v-for="ip in item.ip6" :key="ip" class="py-1">{{ ip }}</div>
                                <div class="py-1" v-if="item.ip6.length === 0">-</div>
                            </template>
                        </VDataTable>
                    </div>
                </div>
            </VCardText>
        </VCard>
    </div>
</template>
<style scoped>
textarea {
    width: 100%;
    min-height: 450px;
    font-family: monospace, monospace;
    overflow: scroll;
    line-break: unset;
    white-space: nowrap;
}
</style>
