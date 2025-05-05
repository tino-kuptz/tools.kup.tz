<script setup>
useHead({
    title: 'DNS Scanner',
    meta: [
        {
            description: 'Versucht eine Webseite möglichst genau abzuscannen.',
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
        const data = await raw_get('/api/dns/scan', { domain: domain.value });
        if (data) {
            response.value = data;

            $toast.success(response.value.records.length + ' DNS-Records gefunden.', {
                position: "bottom-center",
            })
        } else {
            $toast.error('Fehler beim Abrufen der NS-Daten', {
                position: "bottom-center",
            })
        }
    } catch (e) {
        console.error(e.stack);
        $toast.error('Fehler beim Abrufen der NS-Daten\n' + e.message, {
            position: "bottom-center",
        })
    } finally {
        isLoading.value = false;
    }
}

const isEmptyResolvedEntry = (entry) => {
    const resolveA = entry.resolve_a || [];
    const resolveAAAA = entry.resolve_aaaa || [];
    return resolveA.length === 0 && resolveAAAA.length === 0;
}
</script>
<template>
    <div>
        <h2 class="mb-2">DNS Scanner</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool kann eine Webseite gescannt werden, um Informationen über diese zu bekommen.
                        Dabei werden verschiedene DNS-Records abgefragt, um Informationen über die Domain zu
                        erhalten.<br>
                        Dieses Tool ist nützlich, wenn du eine Domain zu einem neuen Anbieter migrieren möchtest,
                        allerdings keinen Zugriff auf die ursprüngliche Zone hast.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <h3 class="mb-3">Domain</h3>
                <p>Hier kannst du die Domain angeben, die du scannen möchtest.
                    Bitte gebe hier nur die Domain ein, ohne Protokoll oder ähnlichem (z.B. <code>kup.tz</code>)</p>
                <p>
                    Die Verwendung dieses Tools <strong>verbraucht {{ get_tool_by_url('/dns/scan').tokens }} Token pro
                        Abfrage</strong>. Bitte beachte, dass du nur eine begrenzte Anzahl an Token zur Verfügung hast.
                </p>
                <p>
                    Scan-Ergebnisse werden für bis zu einer Stunde zwischengespeichert. Wenn du die Domain
                    erneut scannst, wird das Ergebnis möglicherweise nicht sofort aktualisiert.
                    Wenn eine zwischengespeicherte Abfrage zurückgegeben wird, werden dir keine Tokens abgezogen.
                </p>
                <VTextField v-model="domain" class="w-100" label="Domain" placeholder="example.com"
                    :disabled="isLoading" />
                <VBtn color="primary" class="mt-4" :loading="isLoading" @click="doRequest">
                    Abfragen
                </VBtn>
            </VCardText>
            <VCardText class="px-2">
                <div v-if="isLoading" class="px-4">
                    <h3 class="mb-3">NS Records</h3>

                    <VProgressCircular indeterminate color="primary" class="me-1" />
                    DNS-Records werden abgerufen...

                </div>
                <div v-else-if="response" class="text-h6 mb-1 px-4">
                    <h3 class="mb-3">DNS Records</h3>

                    <VAlert v-if="response.truncated" type="warning" border="start" color="red" outlined class="mb-3">
                        <p>
                            Die weitere Auflösung der DNS-Records wurde abgebrochen, da die Antwort zu lang war.
                        </p>
                        <p class="mb-0">
                            Die unten geführte Liste ist nicht vollständig.
                        </p>
                    </VAlert>

                    <div>
                        <VDataTable :headers="[
                            { title: 'Domain', value: 'domain' },
                            { title: 'Typ', value: 'type' },
                            { title: 'Wert', value: 'value' },
                            { title: 'Aufgelöst', value: 'resolve' },
                        ]" :items="response.records" item-value="ns" class="elevation-1">
                            <template #item.domain="{ item }">
                                <code>{{ item.domain }}</code>
                            </template>
                            <template #item.type="{ item }">
                                <code>{{ item.type }}</code>
                            </template>
                            <template #item.value="{ item }">
                                <code>{{ item.value }}</code>
                            </template>
                            <template #item.resolve="{ item }">
                                <div v-for="ip in item.resolve_a" :key="ip" class="d-inline-block pe-3">
                                    <code>{{ ip }}</code>
                                </div>
                                <div v-for="ip in item.resolve_aaaa" :key="ip" class="d-inline-block pe-2">
                                    <code>{{ ip }}</code>
                                </div>
                                <div v-if="item.type === 'A' || item.type === 'AAAA'">
                                    <small>(siehe "Wert")</small>
                                </div>
                                <div class="py-1" v-else-if="isEmptyResolvedEntry(item) && item.type == 'CNAME'">
                                    -
                                </div>
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
