<script setup>
import * as exifr from 'exifr'
import piexif from 'piexifjs'

const { t } = useI18n()
const { $toast } = useNuxtApp()

useCustomI18nHead({
    title: t('pages.image.metadata.title'),
    meta: [
        {
            description: t('pages.image.metadata.description'),
        },
    ],
})

const fileInput = ref(null)
const selectedFile = ref(null)
const workingBlob = ref(null)
const originalMimeType = ref('')
const exifEntries = ref([])
const xmpData = ref(null)
const iptcData = ref(null)
const rawXmpPacket = ref('')
const rawIptcPacket = ref('')
const editableExif = ref({})
const isLoading = ref(false)
const hasChanges = ref(false)
const anonymizedInfo = ref([])

const hasExif = computed(() => exifEntries.value.length > 0)
const hasXmp = computed(() => Boolean(xmpData.value) || Boolean(rawXmpPacket.value))
const hasIptc = computed(() => Boolean(iptcData.value) || Boolean(rawIptcPacket.value))

const canEditExif = computed(() => originalMimeType.value === 'image/jpeg' && hasExif.value)

const resetState = () => {
    selectedFile.value = null
    workingBlob.value = null
    originalMimeType.value = ''
    exifEntries.value = []
    xmpData.value = null
    iptcData.value = null
    rawXmpPacket.value = ''
    rawIptcPacket.value = ''
    editableExif.value = {}
    isLoading.value = false
    hasChanges.value = false
    anonymizedInfo.value = []
}

const isAllowedExtension = (name = '') => /\.(png|jpe?g)$/i.test(name)

const hasValidMagicBytes = (bytes) => {
    const isPng = bytes.length >= 8
        && bytes[0] === 0x89
        && bytes[1] === 0x50
        && bytes[2] === 0x4E
        && bytes[3] === 0x47
        && bytes[4] === 0x0D
        && bytes[5] === 0x0A
        && bytes[6] === 0x1A
        && bytes[7] === 0x0A

    const isJpeg = bytes.length >= 3
        && bytes[0] === 0xFF
        && bytes[1] === 0xD8
        && bytes[2] === 0xFF

    return isPng || isJpeg
}

const safeStringify = value => {
    try {
        return JSON.stringify(value)
    }
    catch {
        return String(value)
    }
}

const normalizeEditableValue = (value) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) {
        return safeStringify(value)
    }
    return value === undefined || value === null ? '' : String(value)
}

const exifValueToString = (value) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) {
        return safeStringify(value)
    }
    return String(value)
}

const prettyPrint = (value) => {
    if (typeof value === 'string') return value
    try {
        return JSON.stringify(value, null, 2)
    }
    catch {
        return String(value)
    }
}

const tryParseEditedValue = (rawValue, originalValue) => {
    if (typeof originalValue === 'number') {
        const num = Number(rawValue)
        return Number.isNaN(num) ? originalValue : num
    }

    if (typeof originalValue === 'string') {
        return rawValue
    }

    if (typeof originalValue === 'boolean') {
        return rawValue === 'true'
    }

    if (Array.isArray(originalValue) || (originalValue && typeof originalValue === 'object')) {
        try {
            return JSON.parse(rawValue)
        }
        catch {
            return originalValue
        }
    }

    return rawValue
}

const flattenExif = (exifObj) => {
    const entries = []
    const editable = {}
    for (const ifdName of ['0th', 'Exif', 'GPS', 'Interop', '1st']) {
        if (!exifObj[ifdName] || typeof exifObj[ifdName] !== 'object') continue
        for (const [tagIdString, value] of Object.entries(exifObj[ifdName])) {
            const tagId = Number(tagIdString)
            if (Number.isNaN(tagId)) continue
            const tagConfig = piexif.TAGS?.[ifdName]?.[tagId]
            const technicalName = tagConfig?.name || `${ifdName}.${tagId}`
            const isEditable = !technicalName.includes('MakerNote') && !technicalName.includes('Thumbnail')
            const key = `${ifdName}:${tagId}`
            entries.push({
                key,
                ifd: ifdName,
                tagId,
                technicalName,
                value,
                valueString: exifValueToString(value),
                editable: isEditable,
            })
            editable[key] = normalizeEditableValue(value)
        }
    }
    exifEntries.value = entries.sort((a, b) => a.technicalName.localeCompare(b.technicalName))
    editableExif.value = editable
}

const readMetadata = async () => {
    if (!workingBlob.value) return

    const fileBytes = new Uint8Array(await workingBlob.value.arrayBuffer())
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('read-error'))
        reader.readAsDataURL(workingBlob.value)
    })

    xmpData.value = await exifr.parse(fileBytes, {
        exif: false, iptc: false, xmp: true, gps: false, tiff: false, jfif: false, ihdr: false, icc: false,
    }).catch(() => null)
    iptcData.value = await exifr.parse(fileBytes, {
        exif: false, iptc: true, xmp: false, gps: false, tiff: false, jfif: false, ihdr: false, icc: false,
    }).catch(() => null)
    rawXmpPacket.value = await exifr.parse(fileBytes, { xmp: true, pick: ['xmp'], exif: false, iptc: false })
        .then(res => (res?.xmp ? prettyPrint(res.xmp) : ''))
        .catch(() => '')
    rawIptcPacket.value = await exifr.parse(fileBytes, { iptc: true, pick: ['iptc'], exif: false, xmp: false })
        .then(res => (res?.iptc ? prettyPrint(res.iptc) : ''))
        .catch(() => '')

    if (originalMimeType.value === 'image/jpeg') {
        try {
            const exifObj = piexif.load(dataUrl)
            flattenExif(exifObj)
        }
        catch {
            exifEntries.value = []
            editableExif.value = {}
        }
    }
    else {
        exifEntries.value = []
        editableExif.value = {}
    }
}

const onFileChange = async (event) => {
    const file = event.target?.files?.[0]
    if (!file) return

    isLoading.value = true
    try {
        const mimeAllowed = ['image/png', 'image/jpeg'].includes(file.type)
        const extAllowed = isAllowedExtension(file.name)
        const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
        const magicAllowed = hasValidMagicBytes(bytes)

        if (!mimeAllowed || !extAllowed || !magicAllowed) {
            $toast.error(t('pages.image.metadata.errors.invalidImage'), { position: 'bottom-center' })
            if (event.target) event.target.value = ''
            resetState()
            return
        }

        selectedFile.value = file
        workingBlob.value = file
        originalMimeType.value = file.type
        hasChanges.value = false
        anonymizedInfo.value = []
        await readMetadata()
        $toast.success(t('pages.image.metadata.readSuccess'), { position: 'bottom-center' })
    }
    catch {
        $toast.error(t('pages.image.metadata.errors.readFailed'), { position: 'bottom-center' })
        resetState()
    }
    finally {
        isLoading.value = false
    }
}

const applyExifEdits = async () => {
    if (!selectedFile.value || originalMimeType.value !== 'image/jpeg' || !hasExif.value) return

    isLoading.value = true
    try {
        const originalDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(new Error('read-error'))
            reader.readAsDataURL(workingBlob.value)
        })
        const exifObj = piexif.load(originalDataUrl)

        for (const entry of exifEntries.value) {
            if (!entry.editable) continue
            const key = entry.key
            const nextRawValue = editableExif.value[key]
            const nextValue = tryParseEditedValue(nextRawValue, entry.value)
            if (!exifObj[entry.ifd]) exifObj[entry.ifd] = {}
            exifObj[entry.ifd][entry.tagId] = nextValue
        }

        const exifBytes = piexif.dump(exifObj)
        const outputDataUrl = piexif.insert(exifBytes, originalDataUrl)
        const response = await fetch(outputDataUrl)
        const blob = await response.blob()
        workingBlob.value = blob
        hasChanges.value = true
        anonymizedInfo.value = []
        await readMetadata()
        $toast.success(t('pages.image.metadata.editSuccess'), { position: 'bottom-center' })
    }
    catch {
        $toast.error(t('pages.image.metadata.errors.editFailed'), { position: 'bottom-center' })
    }
    finally {
        isLoading.value = false
    }
}

const anonymizeMetadata = async () => {
    if (!workingBlob.value) return
    isLoading.value = true
    try {
        const image = new Image()
        const url = URL.createObjectURL(workingBlob.value)
        await new Promise((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('image-load-error'))
            image.src = url
        })

        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        URL.revokeObjectURL(url)

        const mimeType = originalMimeType.value || 'image/png'
        const cleanBlob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('blob-create-error'))
                    return
                }
                resolve(blob)
            }, mimeType, 0.95)
        })

        const removed = []
        if (hasExif.value) removed.push('EXIF')
        if (hasXmp.value) removed.push('XMP')
        if (hasIptc.value) removed.push('IPTC')

        workingBlob.value = cleanBlob
        hasChanges.value = true
        anonymizedInfo.value = removed
        await readMetadata()
        $toast.success(t('pages.image.metadata.anonymizeSuccess'), { position: 'bottom-center' })
    }
    catch {
        $toast.error(t('pages.image.metadata.errors.anonymizeFailed'), { position: 'bottom-center' })
    }
    finally {
        isLoading.value = false
    }
}

const downloadResult = () => {
    if (!workingBlob.value || !selectedFile.value) return
    const baseName = selectedFile.value.name.replace(/\.(png|jpe?g)$/i, '')
    const ext = originalMimeType.value === 'image/jpeg' ? 'jpg' : 'png'
    const name = `${baseName}-edited.${ext}`
    const url = URL.createObjectURL(workingBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
</script>

<template>
    <div>
        <h2 class="mb-2">{{ t('pages.image.metadata.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">{{ t('common.about') }}</div>
                    <div class="text-h6 mb-1">{{ t('pages.image.metadata.descriptionText') }}</div>
                    <div class="text-h6 mb-1">{{ t('pages.image.metadata.descriptionPrivacy') }}</div>
                </div>
            </VCardItem>
        </VCard>

        <VCard class="mb-4">
            <VCardItem>
                <h3 class="mb-3">{{ t('pages.image.metadata.file') }}</h3>
                <input
                    ref="fileInput"
                    type="file"
                    accept="image/png,image/jpeg"
                    class="w-100"
                    @change="onFileChange"
                >
                <div class="d-flex flex-wrap gap-2 mt-4">
                    <VBtn
                        color="warning"
                        :disabled="!selectedFile || isLoading"
                        @click="anonymizeMetadata"
                    >
                        {{ t('pages.image.metadata.anonymize') }}
                    </VBtn>
                    <VBtn
                        color="primary"
                        :disabled="!canEditExif || isLoading"
                        @click="applyExifEdits"
                    >
                        {{ t('pages.image.metadata.applyExifChanges') }}
                    </VBtn>
                    <VBtn
                        color="success"
                        :disabled="!selectedFile || !hasChanges || isLoading"
                        @click="downloadResult"
                    >
                        {{ t('pages.image.metadata.download') }}
                    </VBtn>
                </div>
                <p v-if="anonymizedInfo.length" class="mt-3 text-caption">
                    {{ t('pages.image.metadata.removedInfo', { blocks: anonymizedInfo.join(', ') }) }}
                </p>
            </VCardItem>
        </VCard>

        <VCard v-if="selectedFile">
            <VCardItem>
                <h3 class="mb-3">{{ t('pages.image.metadata.results') }}</h3>

                <h4 class="mb-2">EXIF</h4>
                <p v-if="!hasExif" class="text-caption mb-3">{{ t('pages.image.metadata.emptySection') }}</p>
                <VTable v-else density="compact" class="mb-4">
                    <thead>
                        <tr>
                            <th scope="col">{{ t('pages.image.metadata.table.tag') }}</th>
                            <th scope="col">{{ t('pages.image.metadata.table.value') }}</th>
                            <th scope="col">{{ t('pages.image.metadata.table.edit') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in exifEntries" :key="entry.key">
                            <td>{{ entry.technicalName }}</td>
                            <td class="metadata-cell">{{ entry.valueString }}</td>
                            <td>
                                <VTextField
                                    v-model="editableExif[entry.key]"
                                    density="compact"
                                    variant="outlined"
                                    hide-details
                                    :readonly="!entry.editable || !canEditExif"
                                />
                            </td>
                        </tr>
                    </tbody>
                </VTable>

                <h4 class="mb-2">XMP</h4>
                <p v-if="!hasXmp" class="text-caption mb-3">{{ t('pages.image.metadata.emptySection') }}</p>
                <pre v-else class="mb-4">{{ prettyPrint(xmpData || rawXmpPacket) }}</pre>

                <h4 class="mb-2">IPTC</h4>
                <p v-if="!hasIptc" class="text-caption mb-3">{{ t('pages.image.metadata.emptySection') }}</p>
                <pre v-else class="mb-0">{{ prettyPrint(iptcData || rawIptcPacket) }}</pre>
            </VCardItem>
        </VCard>
    </div>
</template>

<style scoped>
div :deep(span.v-btn__content) {
    text-transform: none;
}

.metadata-cell {
    max-width: 450px;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

pre {
    max-height: 40dvh;
    overflow: auto;
    padding: 10px;
    border-radius: 4px;
    background-color: #f5f5f5;
}
</style>
