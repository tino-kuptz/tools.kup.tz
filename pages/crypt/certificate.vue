<script setup>
import { checkChainCompleteness, hashAlgorithmToName, parseCertificates as parseCertificatesUtil, resolveCTLogId, signatureAlgorithmToName } from '~/utils/certificateParser';

const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.crypt.certificate.title'),
    meta: [
        {
            description: t('pages.crypt.certificate.description'),
        },
    ],
})

const { $toast } = useNuxtApp()

const certificateInput = ref('');
const parsedCertificates = ref([]);
const isParsing = ref(false);
const chainComplete = ref(null);
const showFullSignature = ref(null);
const ctLogInfo = ref({}); // Map of logId -> log info

// Parse Certificates
const parseCertificates = async () => {
    if (!certificateInput.value.trim()) {
        $toast.error(t('common.errors.pleaseEnterCertificate'), {
            position: "bottom-center",
        });
        return;
    }

    isParsing.value = true;
    try {
        const parsed = await parseCertificatesUtil(certificateInput.value.trim());
        parsedCertificates.value = parsed;

        // Check chain completeness
        chainComplete.value = checkChainCompleteness(parsedCertificates.value);

        // Resolve CT Log IDs
        ctLogInfo.value = {};
        for (const cert of parsedCertificates.value) {
            if (cert.certificateTransparency?.scts) {
                for (const sct of cert.certificateTransparency.scts) {
                    if (sct.logId && !ctLogInfo.value[sct.logId]) {
                        const logInfo = await resolveCTLogId(sct.logId);
                        if (logInfo) {
                            ctLogInfo.value[sct.logId] = logInfo;
                        }
                    }
                }
            }
        }

        $toast.success(t('pages.crypt.certificate.parseSuccess', { count: parsedCertificates.value.length }), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error(t('pages.crypt.certificate.parseError') + ': ' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isParsing.value = false;
    }
};

const clearParsed = () => {
    parsedCertificates.value = [];
    certificateInput.value = '';
    chainComplete.value = null;
    ctLogInfo.value = {};
};

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        $toast.success(t('pages.crypt.certificate.copySuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error(t('pages.crypt.certificate.copyError'), {
            position: "bottom-center",
        });
    }
};

const scrollToCertificate = (index) => {
    const element = document.getElementById(`cert-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add a highlight effect
        element.style.transition = 'background-color 0.3s';
        element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 2000);
    }
};

const getHashAlgorithmName = (code) => {
    return hashAlgorithmToName(code);
};

const getSignatureAlgorithmName = (code) => {
    return signatureAlgorithmToName(code);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.crypt.certificate.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.certificate.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.certificate.descriptionNote') }}
                    </div>
                    <div class="text-h6 mb-1">
                        <strong>{{ t('pages.crypt.certificate.descriptionPrivacy') }}</strong>
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <!-- Certificate Input -->
        <VCard class="mb-4">
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12">
                        <h3 class="mb-3">{{ t('pages.crypt.certificate.enterCertificates') }}</h3>
                        <textarea v-model="certificateInput" class="w-100"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----&#10;-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            rows="12" :disabled="isParsing"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.certificate.certificatePlaceholder') }}</small>
                        <div class="mt-2">
                            <VBtn color="primary" @click="parseCertificates"
                                :disabled="isParsing || !certificateInput.trim()" role="button">
                                <i class='bx bx-search me-2'></i>
                                {{ t('pages.crypt.certificate.parseCertificates') }}
                            </VBtn>
                            <VBtn color="secondary" @click="clearParsed"
                                :disabled="isParsing || parsedCertificates.length === 0" role="button" class="ms-2">
                                <i class='bx bx-trash me-2'></i>
                                {{ t('pages.crypt.certificate.reset') }}
                            </VBtn>
                        </div>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>

        <!-- Chain Completeness Check -->
        <VAlert :type="chainComplete.complete ? 'success' : 'warning'" variant="tonal" :icon="false"
            v-if="chainComplete" class="mb-4">
            <strong class="me-2">{{ chainComplete.complete ? '✓' : '⚠' }}</strong>
            {{ chainComplete.message }}
        </VAlert>

        <!-- Parsed Certificates -->
        <div v-for="cert in parsedCertificates" :key="cert.index" :id="`cert-${cert.index}`" class="mb-4">
            <VCard>
                <VCardTitle>
                    <div class="d-flex align-center justify-content-between mt-4">
                        <h3 class="mb-0">{{ t('pages.crypt.certificate.certificate') }} #{{ cert.index }}</h3>
                        <VChip v-if="cert.isSelfSigned" color="info" size="small" class="ms-4">
                            {{ t('pages.crypt.certificate.selfSigned') }}
                        </VChip>
                        <VChip :color="cert.basicConstraints.isCA ? 'warning' : 'default'" size="small" class="ms-4">
                            {{ cert.basicConstraints.isCA ? t('pages.crypt.certificate.ca') :
                                t('pages.crypt.certificate.endEntity') }}
                        </VChip>
                        <VChip :color="cert.validity.isValid ? 'success' : 'error'" size="small" class="ms-4">
                            {{ cert.validity.isValid ? t('pages.crypt.certificate.valid') :
                                t('pages.crypt.certificate.expired') }}
                        </VChip>
                        <VChip v-if="cert.certificateTransparency.present" color="success" size="small" class="ms-4">
                            {{ t('pages.crypt.certificate.ct') }}
                        </VChip>
                    </div>
                    <small class="text-muted d-block mb-2">{{ cert.subject.fullDN }}</small>
                </VCardTitle>
                <VCardText v-if="cert.error">
                    <VAlert type="error" variant="tonal">
                        <strong>{{ t('pages.crypt.certificate.error') }}:</strong> {{ cert.error }}
                    </VAlert>
                </VCardText>
                <VCardText v-else>
                    <VRow>
                        <!-- Subject (Für) -->
                        <VCol cols="12" md="6">
                            <h4 class="mb-2">{{ t('pages.crypt.certificate.subject') }}</h4>
                            <VCard variant="outlined">
                                <VCardText>
                                    <div v-if="cert.subject.CN"><strong>CN:</strong> {{ cert.subject.CN }}</div>
                                    <div v-if="cert.subject.O"><strong>O:</strong> {{ cert.subject.O }}</div>
                                    <div v-if="cert.subject.OU"><strong>OU:</strong> {{ cert.subject.OU }}</div>
                                    <div v-if="cert.subject.L"><strong>L:</strong> {{ cert.subject.L }}</div>
                                    <div v-if="cert.subject.ST"><strong>ST:</strong> {{ cert.subject.ST }}</div>
                                    <div v-if="cert.subject.C"><strong>C:</strong> {{ cert.subject.C }}</div>
                                    <div v-if="cert.subject.emailAddress"><strong>E-Mail:</strong> {{
                                        cert.subject.emailAddress }}</div>
                                    <small class="text-muted d-block mt-2">{{ cert.subject.fullDN }}</small>
                                </VCardText>
                            </VCard>
                        </VCol>

                        <!-- Issuer (Herausgeber) -->
                        <VCol cols="12" md="6">
                            <div class="d-flex justify-content-around align-center mb-2">
                                <h4 class="me-auto">{{ t('pages.crypt.certificate.issuer') }}</h4>
                                <div v-if="cert.issuerCertificateIndex">
                                    <VChip color="info" size="small" class="cursor-pointer"
                                        @click="scrollToCertificate(cert.issuerCertificateIndex)"
                                        style="cursor: pointer;">
                                        <i class='bx bx-link-external me-1'></i>
                                        {{ t('pages.crypt.certificate.certificateLink') }} #{{
                                            cert.issuerCertificateIndex }}
                                    </VChip>
                                </div>
                                <div v-else-if="!cert.isSelfSigned">
                                    <small class="text-muted">{{ t('pages.crypt.certificate.issuerNotFound') }}</small>
                                </div>
                            </div>
                            <VCard variant="outlined">
                                <VCardText>
                                    <div v-if="cert.issuer.CN"><strong>CN:</strong> {{ cert.issuer.CN }}</div>
                                    <div v-if="cert.issuer.O"><strong>O:</strong> {{ cert.issuer.O }}</div>
                                    <div v-if="cert.issuer.OU"><strong>OU:</strong> {{ cert.issuer.OU }}</div>
                                    <div v-if="cert.issuer.L"><strong>L:</strong> {{ cert.issuer.L }}</div>
                                    <div v-if="cert.issuer.ST"><strong>ST:</strong> {{ cert.issuer.ST }}</div>
                                    <div v-if="cert.issuer.C"><strong>C:</strong> {{ cert.issuer.C }}</div>
                                    <small class="text-muted d-block mt-2">{{ cert.issuer.fullDN }}</small>

                                </VCardText>
                            </VCard>
                        </VCol>

                        <!-- Public Key -->
                        <VCol cols="12" md="6">
                            <h4 class="mb-2">{{ t('pages.crypt.certificate.publicKey') }}</h4>
                            <VCard variant="outlined">
                                <VCardText>
                                    <div><strong>{{ t('pages.crypt.certificate.type') }}:</strong> {{
                                        cert.publicKey.type }}</div>
                                    <div class="mt-2"><strong>{{ t('pages.crypt.certificate.keySize') }}:</strong> {{
                                        cert.publicKey.keySizeBits }} Bit
                                        ({{ cert.publicKey.keySizeBytes }} Bytes)</div>
                                    <div v-if="cert.publicKey.modulus">
                                        <strong class="d-block mt-2">Modulus (Hex):</strong>
                                        <div class="text-muted small mt-1"
                                            style="max-width: 100%; word-break: break-all;">
                                            {{ cert.publicKey.modulus.hex }}
                                        </div>
                                        <small class="text-muted">
                                            {{ t('pages.crypt.certificate.length') }}: {{ cert.publicKey.modulus.length
                                            }} Zeichen
                                        </small>
                                    </div>
                                    <div v-if="cert.publicKey.exponent">
                                        <strong class="d-block mt-2">{{ t('pages.crypt.certificate.exponent')
                                            }}:</strong>
                                        <div class="mt-1">{{ t('pages.crypt.certificate.hex') }}: {{
                                            cert.publicKey.exponent.hex }}</div>
                                        <div>{{ t('pages.crypt.certificate.decimal') }}: {{
                                            cert.publicKey.exponent.decimal }}</div>
                                    </div>
                                </VCardText>
                            </VCard>
                        </VCol>

                        <!-- Validity, Subject Alternative Names, CA Informationen -->
                        <VCol cols="12" md="6">
                            <h4 class="mb-2">{{ t('pages.crypt.certificate.validity') }}</h4>
                            <VCard variant="outlined">
                                <VCardText>
                                    <div><strong>{{ t('pages.crypt.certificate.validFrom') }}:</strong> {{
                                        formatDate(cert.validity.notBefore) }}</div>
                                    <div><strong>{{ t('pages.crypt.certificate.validUntil') }}:</strong> {{
                                        formatDate(cert.validity.notAfter) }}</div>
                                    <div class="mt-2">
                                        <span v-if="cert.validity.daysRemaining >= 0" class="ms-2">
                                            ({{ cert.validity.daysRemaining }} {{
                                                t('pages.crypt.certificate.daysRemaining') }})
                                        </span>
                                        <span v-else class="ms-2 text-error">
                                            ({{ t('pages.crypt.certificate.expiredDaysAgo', {
                                                days:
                                                    Math.abs(cert.validity.daysRemaining)
                                            }) }})
                                        </span>
                                    </div>
                                </VCardText>
                            </VCard>

                            <h4 class="mt-4 mb-2">{{ t('pages.crypt.certificate.subjectAltNames') }}</h4>
                            <VCard variant="outlined">
                                <VCardText v-if="cert.subjectAltNames && cert.subjectAltNames.length > 0">
                                    <div v-for="(altName, idx) in cert.subjectAltNames" :key="idx" class="mb-1">
                                        <strong>{{ altName.type }}:</strong> {{ altName.value }}
                                    </div>
                                </VCardText>
                                <VCardText v-else class="text-muted">
                                    {{ t('pages.crypt.certificate.noSubjectAltNames') }}
                                </VCardText>
                            </VCard>

                            <h4 class="mt-4 mb-2">{{ t('pages.crypt.certificate.caInfo') }}</h4>
                            <VCard variant="outlined" class="mt-2">
                                <VCardText>
                                    <div v-if="cert.basicConstraints.pathLength !== null" class="mb-2">
                                        <strong>{{ t('pages.crypt.certificate.pathLengthConstraint') }}:</strong> {{
                                            cert.basicConstraints.pathLength }}
                                    </div>
                                    <div v-if="cert.crlDistributionPoints && cert.crlDistributionPoints.length > 0"
                                        class="mt-2">
                                        <strong>{{ t('pages.crypt.certificate.crlDistributionPoints') }}:</strong>
                                        <div v-for="(url, idx) in cert.crlDistributionPoints" :key="idx" class="mt-1">
                                            <a :href="url" target="_blank" rel="noopener noreferrer"
                                                class="text-break">{{ url }}</a>
                                        </div>
                                    </div>
                                    <div v-if="cert.basicConstraints.pathLength === null && (!cert.crlDistributionPoints || cert.crlDistributionPoints.length === 0)"
                                        class="text-muted">
                                        {{ t('pages.crypt.certificate.noCaInfo') }}
                                    </div>
                                </VCardText>
                            </VCard>
                        </VCol>

                        <!-- Key Usage -->
                        <VCol cols="12" md="6">
                            <h4 class="mb-2">{{ t('pages.crypt.certificate.keyUsage') }}</h4>
                            <VCard variant="outlined">
                                <VCardText v-if="cert.keyUsage">
                                    <template v-for="(value, key) in cert.keyUsage" :key="key">
                                        <template v-if="value">
                                            <VChip size="small" color="default" class="ms-3 mb-1">{{ key }}</VChip>
                                        </template>
                                    </template>
                                    <div v-if="!Object.values(cert.keyUsage).some(v => v)" class="text-muted">
                                        {{ t('pages.crypt.certificate.noKeyUsageFlags') }}
                                    </div>
                                </VCardText>
                                <VCardText v-else class="text-muted">
                                    {{ t('pages.crypt.certificate.noKeyUsageExtension') }}
                                </VCardText>
                            </VCard>
                        </VCol>

                        <!-- Certificate Transparency + Extended Key Usage -->
                        <VCol cols="12" md="6">
                            <h4 class="mb-2">{{ t('pages.crypt.certificate.extendedKeyUsage') }}</h4>
                            <VCard variant="outlined">
                                <VCardText v-if="cert.extKeyUsage && cert.extKeyUsage.length > 0">
                                    <template v-for="usage in cert.extKeyUsage" :key="usage">
                                        <VChip size="small" class="me-3">{{ usage }}</VChip>
                                    </template>
                                </VCardText>
                                <VCardText v-else class="text-muted">
                                    {{ t('pages.crypt.certificate.noExtendedKeyUsageExtension') }}
                                </VCardText>
                            </VCard>
                        </VCol>
                        <VCol cols="12">
                            <h4 class="mt-4 mb-2">{{ t('pages.crypt.certificate.certificateTransparency') }}</h4>
                            <VCard variant="outlined">
                                <VCardText>
                                    <div
                                        v-if="cert.certificateTransparency.present && cert.certificateTransparency.scts && cert.certificateTransparency.scts.length > 0">
                                        <strong class="d-block mb-2">{{ t('pages.crypt.certificate.ctLogs') }}
                                            ({{ cert.certificateTransparency.scts.length }}):
                                        </strong>
                                        <div style="overflow-x: auto;">
                                            <table class="w-100" style="border-collapse: collapse;">
                                                <thead>
                                                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.12);">
                                                        <th class="text-start pa-2" style="min-width: 50px;">#</th>
                                                        <th class="text-start pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.version !== null && s.version !== undefined)"
                                                            style="min-width: 80px;">{{
                                                                t('pages.crypt.certificate.version') }}</th>
                                                        <th class="text-start pa-2" style="min-width: 200px;">{{
                                                            t('pages.crypt.certificate.log') }}
                                                        </th>
                                                        <th class="text-start pa-2" style="min-width: 150px;">{{
                                                            t('pages.crypt.certificate.timestamp') }}
                                                        </th>
                                                        <th class="text-start pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.hashAlgorithm !== null && s.hashAlgorithm !== undefined)"
                                                            style="min-width: 120px;">{{
                                                                t('pages.crypt.certificate.hashAlg') }}</th>
                                                        <th class="text-start pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.signatureAlgorithm !== null && s.signatureAlgorithm !== undefined)"
                                                            style="min-width: 120px;">{{
                                                                t('pages.crypt.certificate.sigAlg') }}</th>
                                                        <th class="text-start pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.extensions)"
                                                            style="min-width: 150px;">{{
                                                                t('pages.crypt.certificate.extensions') }}</th>
                                                        <th class="text-start pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.signature)"
                                                            style="min-width: 200px;">{{
                                                                t('pages.crypt.certificate.signature') }}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="sct in cert.certificateTransparency.scts"
                                                        :key="sct.index"
                                                        style="border-bottom: 1px solid rgba(0,0,0,0.08);">
                                                        <td class="pa-2">{{ sct.index }}</td>
                                                        <td class="pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.version !== null && s.version !== undefined)">
                                                            <VChip
                                                                v-if="sct.version !== null && sct.version !== undefined"
                                                                size="x-small">
                                                                {{ sct.version }}
                                                            </VChip>
                                                            <span v-else class="text-muted">-</span>
                                                        </td>
                                                        <td class="pa-2">
                                                            <div v-if="ctLogInfo[sct.logId]">
                                                                <div class="font-weight-medium mb">
                                                                    {{ ctLogInfo[sct.logId].operator }}
                                                                </div>
                                                                <div class="text-caption text-muted mb-1">
                                                                    {{ ctLogInfo[sct.logId].description }}
                                                                </div>
                                                                <div v-if="ctLogInfo[sct.logId].url">
                                                                    <a :href="ctLogInfo[sct.logId].url" target="_blank"
                                                                        class="text-caption text-decoration-none">
                                                                        {{ ctLogInfo[sct.logId].url }}
                                                                    </a>
                                                                </div>
                                                                <div class="text-caption mt-1">
                                                                    <code class="small ps-0"
                                                                        style="word-break: break-all; color: rgba(0,0,0,0.6);">{{
                                                                            sct.logId }}</code>
                                                                </div>
                                                            </div>
                                                            <div v-else>
                                                                <div class="text-caption text-muted">
                                                                    {{ t('pages.crypt.certificate.unknownLog') }}
                                                                </div>
                                                                <code class="small ps-0"
                                                                    style="word-break: break-all;">{{ sct.logId }}</code>
                                                            </div>
                                                        </td>
                                                        <td class="pa-2">{{ formatDate(sct.timestamp) }}</td>
                                                        <td class="pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.hashAlgorithm !== null && s.hashAlgorithm !== undefined)">
                                                            <span
                                                                v-if="sct.hashAlgorithm !== null && sct.hashAlgorithm !== undefined">
                                                                {{ getHashAlgorithmName(sct.hashAlgorithm) }}
                                                            </span>
                                                            <span v-else class="text-muted">-</span>
                                                        </td>
                                                        <td class="pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.signatureAlgorithm !== null && s.signatureAlgorithm !== undefined)">
                                                            <span
                                                                v-if="sct.signatureAlgorithm !== null && sct.signatureAlgorithm !== undefined">
                                                                {{ getSignatureAlgorithmName(sct.signatureAlgorithm) }}
                                                            </span>
                                                            <span v-else class="text-muted">-</span>
                                                        </td>
                                                        <td class="pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.extensions)">
                                                            <code v-if="sct.extensions" class="small"
                                                                style="word-break: break-all; max-width: 200px; display: block;">{{
                                                                    sct.extensions }}</code>
                                                            <span v-else class="text-muted">-</span>
                                                        </td>
                                                        <td class="pa-2"
                                                            v-if="cert.certificateTransparency.scts.some(s => s.signature)">
                                                            <div v-if="sct.signature">
                                                                <code class="small ps-0" style="word-break: break-all;"
                                                                    v-if="showFullSignature !== sct.index">{{ sct.signature.substring(0,
                                                                        32) }}...</code>
                                                                <code class="small ps-0" style="word-break: break-all;"
                                                                    v-else>{{
                                                                        sct.signature }}</code>
                                                                <VBtn size="x-small" variant="text"
                                                                    @click="showFullSignature = showFullSignature === sct.index ? null : sct.index"
                                                                    class="ms-1">
                                                                    {{ showFullSignature === sct.index ?
                                                                        t('pages.crypt.certificate.less') :
                                                                        t('pages.crypt.certificate.more') }}
                                                                </VBtn>
                                                            </div>
                                                            <span v-else class="text-muted">-</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div v-if="cert.certificateTransparency.present && cert.certificateTransparency.raw && (!cert.certificateTransparency.scts || cert.certificateTransparency.scts.length === 0)"
                                        class="mt-2">
                                        <small class="text-muted">{{ t('pages.crypt.certificate.sctDataPresent')
                                        }}</small>
                                        <div class="mt-1 font-monospace small"
                                            style="word-break: break-all; max-height: 200px; overflow-y: auto; white-space: pre-wrap;">
                                            {{ typeof cert.certificateTransparency.raw === 'string' ?
                                                cert.certificateTransparency.raw :
                                                JSON.stringify(cert.certificateTransparency.raw, null, 2) }}
                                        </div>
                                    </div>

                                    <div v-if="!cert.certificateTransparency.present || (!cert.certificateTransparency.scts && !cert.certificateTransparency.raw)"
                                        class="text-muted">
                                        {{ t('pages.crypt.certificate.noCtInfo') }}
                                    </div>
                                </VCardText>
                            </VCard>
                        </VCol>

                        <!-- Additional Info -->
                        <VCol cols="12">
                            <h4 class="mb-2">{{ t('pages.crypt.certificate.additionalInfo') }}</h4>
                            <VCard variant="outlined">
                                <VCardText>
                                    <VRow>
                                        <VCol cols="12" md="6">

                                            <div><strong>{{ t('pages.crypt.certificate.serialNumber') }}:</strong> {{
                                                cert.serialNumber }}</div>
                                            <div><strong>{{ t('pages.crypt.certificate.signatureAlgorithm') }}:</strong>
                                                {{
                                                    cert.signatureAlgorithm }}
                                            </div>
                                            <div><strong>{{ t('pages.crypt.certificate.version') }}:</strong> {{
                                                cert.version }}</div>

                                            <strong class="d-block mt-2">{{ t('pages.crypt.certificate.certificatePem')
                                            }}:</strong>
                                            <textarea v-model="cert.pem" class="w-100" rows="8" readonly></textarea>
                                            <VBtn color="primary" @click="copyToClipboard(cert.pem)" class="mt-2"
                                                size="small">
                                                <i class='bx bx-copy me-2'></i>
                                                {{ t('pages.crypt.certificate.copyCertificate') }}
                                            </VBtn>
                                        </VCol>
                                        <VCol cols="12" md="6">
                                            <div v-if="Object.keys(cert.extensions).length > 0">
                                                <strong>{{ t('pages.crypt.certificate.allExtensions') }}:</strong>
                                                <div class="mt-2">
                                                    <div v-for="(ext, key) in cert.extensions" :key="key" class="mb-1">
                                                        <strong>{{ ext.name || key }}:</strong>
                                                        <VChip v-if="ext.critical" color="warning" size="x-small"
                                                            class="ms-1">
                                                            {{ t('pages.crypt.certificate.critical') }}
                                                        </VChip>
                                                        <div class="text-muted small">{{ ext.id }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </VCol>
                                    </VRow>
                                </VCardText>
                            </VCard>
                        </VCol>
                    </VRow>
                </VCardText>
            </VCard>
        </div>

        <div class="text-secondary mt-2">
            <small>Powered by <a href="https://github.com/digitalbazaar/forge" target="_blank">node-forge</a></small>
        </div>
    </div>
</template>
<style scoped>
textarea {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    font-size: 16px;
    width: 100%;
    font-family: monospace;
}

div :deep(span.v-btn__content) {
    text-transform: none;
}
</style>
