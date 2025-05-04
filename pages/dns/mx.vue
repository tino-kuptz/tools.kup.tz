<script setup>
useHead({
    title: 'MX Resolver',
    meta: [
        {
            description: 'Löst die MX-Records für eine Domain auf.',
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
        $toast.error('Bitte gebe eine Domain ein', {
            position: "bottom-center",
        })
        return;
    }

    if (!isValidDomain(domain.value)) {
        $toast.error('Die Domain scheint nicht gültig zu sein.\nBitte versuche es erneut.', {
            position: "bottom-center",
        });
        return;
    }

    isLoading.value = true;
    try {
        const data = await raw_get('/api/dns/mx', { domain: domain.value });
        if (data) {
            response.value = data;

            $toast.success('MX-Daten erfolgreich abgerufen', {
                position: "bottom-center",
            })
        } else {
            $toast.error('Fehler beim Abrufen der MX-Daten', {
                position: "bottom-center",
            })
        }
    } catch (e) {
        $toast.error('Fehler beim Abrufen der MX-Daten\n' + e.message, {
            position: "bottom-center",
        })
    } finally {
        isLoading.value = false;
    }
}
</script>
<template>
    <div>
        <h2 class="mb-2">MX Resolver</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kann ein MX-Record abgefragt werden. Das Tool löst diesen auf, und löst dann
                        ebenfalls die dazu gehörigen Records (A und AAAA) auf.
                    </div>
                    <div class="text-h6 mb-1">
                        Ein MX-Record (Mail Exchange Record) ist ein DNS-Eintrag (Domain Name System), der angibt,
                        welcher Mailserver für den Empfang von E-Mails einer bestimmten Domain zuständig ist. Er wird
                        verwendet, um E-Mails korrekt zuzustellen.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <h3 class="mb-3">Domain</h3>
                <p>
                    Hier kannst du die Domain angeben, für die du die MX-Records auflösen möchtest.
                    Bitte gebe hier nur die Domain ein, ohne Protokoll oder ähnlichem (z.B. <code>kup.tz</code>).
                </p>
                <p>
                    Die Verwendung dieses Tools <strong>verbraucht {{ get_tool_by_url('/dns/mx').tokens }} Token pro
                        Abfrage</strong>. Bitte beachte, dass du nur eine begrenzte Anzahl an Token zur Verfügung hast.
                </p>
                <VTextField v-model="domain" class="w-100" label="Domain" placeholder="example.com"
                    :disabled="isLoading" />
                <VBtn color="primary" class="mt-4" :loading="isLoading" @click="doRequest">
                    Abfragen
                </VBtn>
            </VCardText>
            <VCardText>
                <div v-if="isLoading" class="px-4">
                    <h3 class="mb-3">MX Records</h3>

                    <VProgressCircular indeterminate color="primary" class="me-1" />
                    MX-Records werden abgerufen...
                </div>
                <div v-else-if="response" class="text-h6 mb-1">
                    <h3 class="mb-3">MX Records</h3>

                    <VAlert v-if="response.suspectedIsp" type="info" border="start" color="green" outlined class="mb-3">
                        <p class="mb-0">Der E-Mail Anbieter für diese Domain ist vermutlich {{
                            response.suspectedIsp.name }}.</p>
                    </VAlert>
                    <VAlert v-else type="warning" border="start" color="red" outlined class="mb-3">
                        <p class="mb-0">Der E-Mail Anbieter für diese Domain konnte nicht automatisch festgestellt
                            werden.</p>
                    </VAlert>

                    <div>
                        <VDataTable :headers="[
                            { title: 'Priorität', value: 'priority' },
                            { title: 'Server', value: 'exchange' },
                            { title: 'IPv4', value: 'ip4' },
                            { title: 'IPv6', value: 'ip6' }
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
