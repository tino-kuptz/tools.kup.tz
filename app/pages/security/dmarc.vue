<script setup>
import { computed, onMounted, reactive, watch } from 'vue';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.security.dmarc.title'),
    meta: [{ description: t('pages.security.dmarc.description') }],
})

const { $toast } = useNuxtApp()

const form = reactive({
    domain: '',
    policy: 'none',
    spPolicy: '', // optional
    adkim: 'r',
    aspf: 'r',
    pct: 100,
    ri: 86400,
    fo: { '0': false, '1': false, 'd': false, 's': false },
    ruaList: [''],
    rufList: [''],
})

const normalizeList = (list) => {
    const values = list.map(v => (v ?? '').trim())
    const nonEmpty = values.filter(v => v !== '')
    nonEmpty.push('')
    list.splice(0, list.length, ...nonEmpty)
}

onMounted(() => {
    normalizeList(form.ruaList)
    normalizeList(form.rufList)
})

watch(() => form.ruaList, () => normalizeList(form.ruaList), { deep: true })
watch(() => form.rufList, () => normalizeList(form.rufList), { deep: true })

const removeFromList = (list, index) => {
    list.splice(index, 1)
    normalizeList(list)
}

const dmarcRecordName = computed(() => {
    if (!form.domain.trim()) return ''
    return `_dmarc.${form.domain.trim()}`
})

const buildFo = computed(() => {
    const selected = Object.entries(form.fo).filter(([, v]) => v).map(([k]) => k)
    if (selected.length === 0) return ''
    return selected.join(':')
})

const buildDmarcRecord = computed(() => {
    const parts = ['v=DMARC1']
    if (form.policy) parts.push(`p=${form.policy}`)
    if (form.spPolicy) parts.push(`sp=${form.spPolicy}`)
    if (form.adkim) parts.push(`adkim=${form.adkim}`)
    if (form.aspf) parts.push(`aspf=${form.aspf}`)
    if (form.pct !== undefined && form.pct !== null && form.pct !== 100) parts.push(`pct=${Number(form.pct)}`)
    if (form.ri !== undefined && form.ri !== null && Number(form.ri) !== 86400) parts.push(`ri=${Number(form.ri)}`)

    const rua = form.ruaList.filter(v => (v ?? '').trim() !== '').map(v => v.trim().startsWith('mailto:') ? v.trim() : `mailto:${v.trim()}`)
    if (rua.length) parts.push(`rua=${rua.join(',')}`)
    const ruf = form.rufList.filter(v => (v ?? '').trim() !== '').map(v => v.trim().startsWith('mailto:') ? v.trim() : `mailto:${v.trim()}`)
    if (ruf.length) parts.push(`ruf=${ruf.join(',')}`)

    const fo = buildFo.value
    if (fo) parts.push(`fo=${fo}`)

    return parts.join('; ')
})

const copyValue = async () => {
    try {
        await navigator.clipboard.writeText(buildDmarcRecord.value)
        $toast.success(t('pages.security.dmarc.copyEntrySuccess'), { position: 'bottom-center' })
    } catch (e) {
        $toast.error(t('pages.security.dmarc.copyError') + ': ' + e.message, { position: 'bottom-center' })
    }
}

const copyName = async () => {
    try {
        await navigator.clipboard.writeText(dmarcRecordName.value)
        $toast.success(t('pages.security.dmarc.copyNameSuccess'), { position: 'bottom-center' })
    } catch (e) {
        $toast.error(t('pages.security.dmarc.copyError') + ': ' + e.message, { position: 'bottom-center' })
    }
}
</script>

<template>
    <div>
        <h1 class="mb-4">{{ t('pages.security.dmarc.heading') }}</h1>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">{{ t('common.about') }}</div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.security.dmarc.descriptionText') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-4">{{ t('pages.security.dmarc.parameters') }}</h3>

                        <VTextField v-model="form.domain" :label="t('pages.security.dmarc.domainOptional')"
                            :placeholder="t('common.placeholder.domain')" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">{{ t('pages.security.dmarc.domainOptionalDesc')
                            }}</small>

                        <h4 class="mb-2">{{ t('pages.security.dmarc.policy') }}</h4>
                        <VSelect v-model="form.policy" :label="t('pages.security.dmarc.policy') + ' (p)'" :items="[
                            { title: t('pages.security.dmarc.policyNone'), value: 'none' },
                            { title: t('pages.security.dmarc.policyQuarantine'), value: 'quarantine' },
                            { title: t('pages.security.dmarc.policyReject'), value: 'reject' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">{{ t('pages.security.dmarc.policyDesc')
                            }}</small>

                        <h4 class="mb-2">{{ t('pages.security.dmarc.subdomainPolicy') }}</h4>
                        <VSelect v-model="form.spPolicy" :label="t('pages.security.dmarc.subdomainPolicy') + ' (sp)'"
                            :items="[
                                { title: t('pages.security.dmarc.policyEmpty'), value: '' },
                                { title: t('pages.security.dmarc.policyNone'), value: 'none' },
                                { title: t('pages.security.dmarc.policyQuarantine'), value: 'quarantine' },
                                { title: t('pages.security.dmarc.policyReject'), value: 'reject' }
                            ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">{{
                            t('pages.security.dmarc.subdomainPolicyDesc') }}</small>

                        <h4 class="mb-2">{{ t('pages.security.dmarc.alignment') }}</h4>
                        <VSelect v-model="form.adkim" :label="t('pages.security.dmarc.alignment') + ' - adkim'" :items="[
                            { title: t('pages.security.dmarc.alignmentRelaxed'), value: 'r' },
                            { title: t('pages.security.dmarc.alignmentStrict'), value: 's' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-3 text-medium-emphasis">{{ t('pages.security.dmarc.adkimDesc')
                            }}</small>
                        <VSelect v-model="form.aspf" :label="t('pages.security.dmarc.alignment') + ' - aspf'" :items="[
                            { title: t('pages.security.dmarc.alignmentRelaxed'), value: 'r' },
                            { title: t('pages.security.dmarc.alignmentStrict'), value: 's' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">{{ t('pages.security.dmarc.aspfDesc')
                            }}</small>

                        <h4 class="mb-2">{{ t('pages.security.dmarc.reportRecipients') }}</h4>
                        <div class="mb-1">{{ t('pages.security.dmarc.rua') }}</div>
                        <div v-for="(item, idx) in form.ruaList" :key="'rua-' + idx"
                            class="d-flex align-center gap-2 mb-2">
                            <VTextField v-model="form.ruaList[idx]" :label="t('pages.security.dmarc.emailPlaceholder')"
                                variant="outlined" hide-details />
                            <VBtn v-if="form.ruaList.length > 1 && (form.ruaList[idx] || '').trim() !== ''"
                                variant="text" @click="removeFromList(form.ruaList, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>
                        <small class="d-block mb-3 text-medium-emphasis">{{ t('pages.security.dmarc.ruaDesc') }}</small>
                        <div class="mb-1 mt-4">{{ t('pages.security.dmarc.ruf') }}</div>
                        <div v-for="(item, idx) in form.rufList" :key="'ruf-' + idx"
                            class="d-flex align-center gap-2 mb-2">
                            <VTextField v-model="form.rufList[idx]" :label="t('pages.security.dmarc.emailPlaceholder')"
                                variant="outlined" hide-details />
                            <VBtn v-if="form.rufList.length > 1 && (form.rufList[idx] || '').trim() !== ''"
                                variant="text" @click="removeFromList(form.rufList, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>

                        <h4 class="mt-4 mb-2">{{ t('pages.security.dmarc.fo') }}</h4>
                        <div class="d-flex flex-wrap gap-4 mb-1">
                            <VCheckbox v-model="form.fo['0']" :label="t('pages.security.dmarc.fo0')" />
                            <VCheckbox v-model="form.fo['1']" :label="t('pages.security.dmarc.fo1')" />
                            <VCheckbox v-model="form.fo['d']" :label="t('pages.security.dmarc.fod')" />
                            <VCheckbox v-model="form.fo['s']" :label="t('pages.security.dmarc.fos')" />
                        </div>
                        <small class="d-block mb-4 text-medium-emphasis">{{ t('pages.security.dmarc.foDesc') }}</small>

                        <h4 class="mb-2">{{ t('pages.security.dmarc.other') }}</h4>
                        <VSlider v-model="form.pct" :label="`pct (${form.pct}%)`" :min="1" :max="100" :step="1"
                            show-ticks class="mb-1" />
                        <small class="d-block mb-3 text-medium-emphasis">{{ t('pages.security.dmarc.pctDesc') }}</small>
                        <VTextField v-model.number="form.ri" :label="t('pages.security.dmarc.ri')" type="number"
                            variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">{{ t('pages.security.dmarc.riDesc') }}</small>
                    </VCol>

                    <VCol cols="12" md="6">
                        <h3 class="mb-4">{{ t('pages.security.dmarc.generated') }}</h3>
                        <small class="d-block mb-3">{{ t('pages.security.dmarc.generatedDesc') }}</small>

                        <VCard variant="outlined" class="mb-2">
                            <VCardText>
                                <div class="mb-2">
                                    <div class="text-caption">{{ t('pages.security.dmarc.recordName') }}</div>
                                    <code>{{ dmarcRecordName || '(_dmarc.<deine-domain>)' }}</code>
                                </div>
                                <div>
                                    <div class="text-caption">{{ t('pages.security.dmarc.recordValue') }}</div>
                                    <code>{{ buildDmarcRecord }}</code>
                                </div>
                            </VCardText>
                            <VCardActions>
                                <VBtn variant="text" @click="copyName" :disabled="!dmarcRecordName">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    {{ t('pages.security.dmarc.copyName') }}
                                </VBtn>
                                <VBtn variant="text" @click="copyValue">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    {{ t('pages.security.dmarc.copyEntry') }}
                                </VBtn>
                            </VCardActions>
                        </VCard>
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
