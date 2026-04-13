<script setup>
import { computed, nextTick, onMounted, reactive, watch } from 'vue';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.security.spf.title'),
    meta: [{ description: t('pages.security.spf.description') }],
})

const { $toast } = useNuxtApp()

// Formularzustand
const spf = reactive({
    a: true,
    mx: true,
    ip4List: [''],
    ip6List: [''],
    includeList: [''],
    policy: '~all', // '~all' | '-all' | '?all' | '+all'
})

// Import-Feld für vorhandenen SPF-Record
const spfImport = reactive({ value: '' })

// Hilfsfunktionen für dynamische Listenfelder: Immer genau ein leeres Feld am Ende lassen
const normalizeList = (list) => {
    const values = list.map(v => (v ?? '').trim())
    const nonEmpty = values.filter(v => v !== '')
    nonEmpty.push('')
    list.splice(0, list.length, ...nonEmpty)
}

onMounted(() => {
    normalizeList(spf.ip4List)
    normalizeList(spf.ip6List)
    normalizeList(spf.includeList)
})

watch(() => spf.ip4List, () => normalizeList(spf.ip4List), { deep: true })
watch(() => spf.ip6List, () => normalizeList(spf.ip6List), { deep: true })
watch(() => spf.includeList, () => normalizeList(spf.includeList), { deep: true })

const removeFromList = (list, index) => {
    list.splice(index, 1)
    normalizeList(list)
}

// Fokus-Handling: Beim Leeren eines Feldes per Backspace zum letzten (leeren) Feld springen
const onBackspaceEmpty = (kind, idx) => {
    const list = kind === 'ip4' ? spf.ip4List : kind === 'ip6' ? spf.ip6List : spf.includeList
    const val = (list[idx] ?? '')
    if (val.length === 1) {
        nextTick(() => {
            const inputs = Array.from(document.querySelectorAll(`[data-kind="${kind}"] input`))
            const last = inputs[inputs.length - 1]
            last?.focus?.()
        })
    }
}

// SPF-Record bauen
const buildSpfRecord = computed(() => {
    const parts = ['v=spf1']
    if (spf.a) parts.push('a')
    if (spf.mx) parts.push('mx')

    spf.ip4List.filter(v => (v ?? '').trim() !== '').forEach(ip => parts.push(`ip4:${ip.trim()}`))
    spf.ip6List.filter(v => (v ?? '').trim() !== '').forEach(ip => parts.push(`ip6:${ip.trim()}`))
    spf.includeList.filter(v => (v ?? '').trim() !== '').forEach(d => parts.push(`include:${d.trim()}`))

    parts.push(spf.policy)
    return parts.join(' ')
})

// SPF-String importieren und Formular befüllen
const parseSpf = () => {
    const raw = (spfImport.value || '').trim().replace(/^"|"$/g, '')
    if (!raw) return
    const tokens = raw.split(/\s+/).filter(Boolean)
    if (tokens.length === 0 || tokens[0].toLowerCase() !== 'v=spf1') {
        $toast?.error(t('pages.security.spf.importError'), { position: 'bottom-center' })
        return
    }

    // Reset
    spf.a = false
    spf.mx = false
    spf.ip4List.splice(0)
    spf.ip6List.splice(0)
    spf.includeList.splice(0)
    spf.policy = '~all'

    tokens.slice(1).forEach(tok => {
        if (tok === 'a') spf.a = true
        else if (tok === 'mx') spf.mx = true
        else if (tok.startsWith('ip4:')) spf.ip4List.push(tok.substring(4))
        else if (tok.startsWith('ip6:')) spf.ip6List.push(tok.substring(4))
        else if (tok.startsWith('include:')) spf.includeList.push(tok.substring(8))
        else if (/^[~\-\?\+]all$/i.test(tok)) spf.policy = tok.toLowerCase()
    })

    normalizeList(spf.ip4List)
    normalizeList(spf.ip6List)
    normalizeList(spf.includeList)
    $toast?.success(t('pages.security.spf.importSuccess'), { position: 'bottom-center' })
}

const copySpf = async () => {
    try {
        await navigator.clipboard.writeText(buildSpfRecord.value)
        $toast.success(t('pages.security.spf.copySuccess'), { position: 'bottom-center' })
    } catch (e) {
        $toast.error(t('pages.security.spf.copyError') + ': ' + e.message, { position: 'bottom-center' })
    }
}
</script>

<template>
    <div>
        <h1 class="mb-4">{{ t('pages.security.spf.heading') }}</h1>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">{{ t('common.about') }}</div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.security.spf.descriptionText') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-4">{{ t('pages.security.spf.parameters') }}</h3>

                        <VCheckbox v-model="spf.a" :label="t('pages.security.spf.allowA')" class="mb-2" />
                        <VCheckbox v-model="spf.mx" :label="t('pages.security.spf.allowMx')" class="mb-4" />

                        <h4>{{ t('pages.security.spf.ipv4') }}</h4>
                        <small class="d-block mb-3">{{ t('pages.security.spf.ipv4Desc') }}</small>
                        <div v-for="(item, idx) in spf.ip4List" :key="'ip4-' + idx"
                            class="d-flex align-center gap-2 mb-2" data-kind="ip4">
                            <VTextField v-model="spf.ip4List[idx]" label="IPv4" variant="outlined" hide-details
                                @keydown.backspace="onBackspaceEmpty('ip4', idx)" />
                            <VBtn v-if="spf.ip4List.length > 1 && (spf.ip4List[idx] || '').trim() !== ''" variant="text"
                                @click="removeFromList(spf.ip4List, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>

                        <h4 class="mt-4">{{ t('pages.security.spf.ipv6') }}</h4>
                        <small class="d-block mb-3">{{ t('pages.security.spf.ipv6Desc') }}</small>
                        <div v-for="(item, idx) in spf.ip6List" :key="'ip6-' + idx"
                            class="d-flex align-center gap-2 mb-2" data-kind="ip6">
                            <VTextField v-model="spf.ip6List[idx]" label="IPv6" variant="outlined" hide-details
                                @keydown.backspace="onBackspaceEmpty('ip6', idx)" />
                            <VBtn v-if="spf.ip6List.length > 1 && (spf.ip6List[idx] || '').trim() !== ''" variant="text"
                                @click="removeFromList(spf.ip6List, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>

                        <h4 class="mt-4">{{ t('pages.security.spf.includeDomains') }}</h4>
                        <small class="d-block mb-3">{{ t('pages.security.spf.includeDomainsDesc') }}</small>
                        <div v-for="(item, idx) in spf.includeList" :key="'inc-' + idx"
                            class="d-flex align-center gap-2 mb-2" data-kind="include">
                            <VTextField v-model="spf.includeList[idx]" :label="t('common.domain')" variant="outlined"
                                hide-details @keydown.backspace="onBackspaceEmpty('include', idx)" />
                            <VBtn v-if="spf.includeList.length > 1 && (spf.includeList[idx] || '').trim() !== ''"
                                variant="text" @click="removeFromList(spf.includeList, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>

                        <h4 class="mt-4">{{ t('pages.security.spf.fallbackPolicy') }}</h4>
                        <small class="d-block mb-3">{{ t('pages.security.spf.fallbackPolicyDesc') }}</small>
                        <VSelect v-model="spf.policy" label="Policy" :items="[
                            { title: 'SoftFail (~all)', value: '~all' },
                            { title: 'HardFail (-all)', value: '-all' },
                            { title: 'Neutral (?all)', value: '?all' },
                            { title: 'Pass (+all)', value: '+all' }
                        ]" variant="outlined" class="mb-4" />
                    </VCol>

                    <VCol cols="12" md="6">
                        <h3 class="mb-2">{{ t('pages.security.spf.import') }}</h3>
                        <small class="d-block mb-3">{{ t('pages.security.spf.importDesc') }}</small>
                        <VTextField v-model="spfImport.value" :label="t('pages.security.spf.import')"
                            placeholder="v=spf1 a mx ip4:203.0.113.10/32 ~all" variant="outlined" class="mb-3"
                            @keyup.enter="parseSpf" />
                        <div class="d-flex justify-end mb-4">
                            <VBtn color="primary" @click="parseSpf">
                                {{ t('pages.security.spf.importButton') }}
                            </VBtn>
                        </div>

                        <h3>{{ t('pages.security.spf.generatedEntry') }}</h3>
                        <small class="d-block mb-3">{{ t('pages.security.spf.generatedEntryDesc') }}</small>

                        <VCard variant="outlined">
                            <VCardText>
                                <code class="d-block">{{ buildSpfRecord }}</code>
                            </VCardText>
                        </VCard>

                        <div class="d-flex justify-end mt-3">
                            <VBtn color="primary" @click="copySpf">
                                <VIcon icon="bx-copy" class="me-2" />
                                {{ t('common.clipboard') }}
                            </VBtn>
                        </div>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
    </div>

</template>

<style scoped>
code {
    display: block;
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
