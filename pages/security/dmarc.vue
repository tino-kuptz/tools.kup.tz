<script setup>
import { computed, onMounted, reactive, watch } from 'vue'

useHead({
    title: 'DMARC Generator',
    meta: [{ description: 'Erstellt DMARC-DNS-Einträge im Browser.' }],
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
        $toast.success('DMARC-Eintrag kopiert', { position: 'bottom-center' })
    } catch (e) {
        $toast.error('Fehler beim Kopieren: ' + e.message, { position: 'bottom-center' })
    }
}

const copyName = async () => {
    try {
        await navigator.clipboard.writeText(dmarcRecordName.value)
        $toast.success('Record-Name kopiert', { position: 'bottom-center' })
    } catch (e) {
        $toast.error('Fehler beim Kopieren: ' + e.message, { position: 'bottom-center' })
    }
}
</script>

<template>
    <div>
        <h1 class="mb-4">DMARC Generator</h1>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">Über dieses Tool</div>
                    <div class="text-h6 mb-1">
                        Erstelle DMARC-DNS-Einträge komfortabel im Browser. Es werden keine Daten an den Server
                        gesendet.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-4">Parameter</h3>

                        <VTextField v-model="form.domain" label="Domain (optional)" placeholder="example.com"
                            variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">Optional: Wird zur Anzeige des Record-Namens
                            genutzt (z. B. _dmarc.example.com).</small>

                        <h4 class="mb-2">Policy</h4>
                        <VSelect v-model="form.policy" label="Policy (p)" :items="[
                            { title: 'none (nur berichten)', value: 'none' },
                            { title: 'quarantine', value: 'quarantine' },
                            { title: 'reject', value: 'reject' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">Legt fest, wie Empfänger mit nicht
                            konformen E-Mails umgehen: none = nur Berichte, quarantine = in Quarantäne, reject =
                            ablehnen.</small>

                        <h4 class="mb-2">Subdomain-Policy</h4>
                        <VSelect v-model="form.spPolicy" label="Subdomain-Policy (sp)" :items="[
                            { title: '— (leer lassen)', value: '' },
                            { title: 'none', value: 'none' },
                            { title: 'quarantine', value: 'quarantine' },
                            { title: 'reject', value: 'reject' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">Gilt für Subdomains. Wenn leer, wird die
                            Haupt-Policy (p) verwendet.</small>

                        <h4 class="mb-2">Ausrichtung</h4>
                        <VSelect v-model="form.adkim" label="adkim" :items="[
                            { title: 'relaxed (r)', value: 'r' },
                            { title: 'strict (s)', value: 's' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-3 text-medium-emphasis">adkim steuert die DKIM-Ausrichtung:
                            relaxed (r) erlaubt Subdomains, strict (s) verlangt exakte Domain-Übereinstimmung.</small>
                        <VSelect v-model="form.aspf" label="aspf" :items="[
                            { title: 'relaxed (r)', value: 'r' },
                            { title: 'strict (s)', value: 's' }
                        ]" variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">aspf steuert die SPF-Ausrichtung:
                            relaxed (r) erlaubt Subdomains, strict (s) verlangt exakte Domain-Übereinstimmung.</small>

                        <h4 class="mb-2">Berichtsempfänger</h4>
                        <div class="mb-1">rua (Aggregatberichte)</div>
                        <div v-for="(item, idx) in form.ruaList" :key="'rua-' + idx"
                            class="d-flex align-center gap-2 mb-2">
                            <VTextField v-model="form.ruaList[idx]" label="E-Mail oder mailto:..." variant="outlined"
                                hide-details />
                            <VBtn v-if="form.ruaList.length > 1 && (form.ruaList[idx] || '').trim() !== ''"
                                variant="text" @click="removeFromList(form.ruaList, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>
                        <small class="d-block mb-3 text-medium-emphasis">Mehrere Empfänger möglich. Es wird empfohlen,
                            mailto: zu verwenden (z. B. mailto:dmarc@example.com).</small>
                        <div class="mb-1 mt-4">ruf (Forensikberichte)</div>
                        <div v-for="(item, idx) in form.rufList" :key="'ruf-' + idx"
                            class="d-flex align-center gap-2 mb-2">
                            <VTextField v-model="form.rufList[idx]" label="E-Mail oder mailto:..." variant="outlined"
                                hide-details />
                            <VBtn v-if="form.rufList.length > 1 && (form.rufList[idx] || '').trim() !== ''"
                                variant="text" @click="removeFromList(form.rufList, idx)">
                                <VIcon icon="bx-x" />
                            </VBtn>
                        </div>

                        <h4 class="mt-4 mb-2">Fehleroptionen (fo)</h4>
                        <div class="d-flex flex-wrap gap-4 mb-1">
                            <VCheckbox v-model="form.fo['0']" label="0 (Standard)" />
                            <VCheckbox v-model="form.fo['1']" label="1 (jede Mail)" />
                            <VCheckbox v-model="form.fo['d']" label="d (DKIM fail)" />
                            <VCheckbox v-model="form.fo['s']" label="s (SPF fail)" />
                        </div>
                        <small class="d-block mb-4 text-medium-emphasis">Steuert, wann Forensikberichte gesendet
                            werden: 0 = nur wenn sowohl SPF als auch DKIM (ausgerichtet) fehlschlagen, 1 = bei jedem
                            Fehler, d = bei DKIM-Fehler, s = bei SPF-Fehler.</small>

                        <h4 class="mb-2">Sonstiges</h4>
                        <VSlider v-model="form.pct" :label="`pct (${form.pct}%)`" :min="1" :max="100" :step="1"
                            show-ticks class="mb-1" />
                        <small class="d-block mb-3 text-medium-emphasis">pct legt fest, welcher Anteil der Nachrichten
                            der Policy unterliegt (Standard 100%).</small>
                        <VTextField v-model.number="form.ri" label="Reporting-Intervall (ri, Sekunden)" type="number"
                            variant="outlined" class="mb-2" />
                        <small class="d-block mb-4 text-medium-emphasis">ri gibt das Intervall in Sekunden für
                            Aggregatberichte an (Standard 86400 = 24 Stunden).</small>
                    </VCol>

                    <VCol cols="12" md="6">
                        <h3 class="mb-4">Generierter DMARC-Eintrag</h3>
                        <small class="d-block mb-3">Der Eintrag wird als TXT-Record veröffentlicht.</small>

                        <VCard variant="outlined" class="mb-2">
                            <VCardText>
                                <div class="mb-2">
                                    <div class="text-caption">Record-Name</div>
                                    <code>{{ dmarcRecordName || '(_dmarc.<deine-domain>)' }}</code>
                                </div>
                                <div>
                                    <div class="text-caption">Record-Wert</div>
                                    <code>{{ buildDmarcRecord }}</code>
                                </div>
                            </VCardText>
                            <VCardActions>
                                <VBtn variant="text" @click="copyName" :disabled="!dmarcRecordName">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    Namen kopieren
                                </VBtn>
                                <VBtn variant="text" @click="copyValue">
                                    <VIcon icon="bx-copy" class="me-2" />
                                    Wert kopieren
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
