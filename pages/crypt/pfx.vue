<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.crypt.pfx.title'),
    meta: [
        {
            description: t('pages.crypt.pfx.description'),
        },
    ],
})

const { $toast } = useNuxtApp()

const privateKey = ref('');
const certificate = ref('');
const caChain = ref('');
const pfxPassword = ref('');
const isWorking = ref(false);
const showPasswordWarning = ref(false);

const createPfx = async () => {
    // Validierung
    if (!privateKey.value.trim()) {
        $toast.error(t('common.errors.pleaseEnter', { field: t('pages.crypt.pfx.privateKey') }), {
            position: "bottom-center",
        });
        return;
    }

    if (!certificate.value.trim()) {
        $toast.error(t('common.errors.pleaseEnter', { field: t('pages.crypt.pfx.certificate') }), {
            position: "bottom-center",
        });
        return;
    }

    // Wenn kein Passwort eingegeben wurde, Modal anzeigen
    if (!pfxPassword.value || !pfxPassword.value.trim()) {
        showPasswordWarning.value = true;
        return;
    }

    // Wenn Passwort vorhanden, direkt erstellen
    await doCreatePfx();
};

const doCreatePfx = async () => {
    // Dynamisch importieren, um SSR zu vermeiden
    const forge = await import('node-forge');

    isWorking.value = true;
    showPasswordWarning.value = false;

    try {
        // Private Key parsen
        let privateKeyObj;
        try {
            privateKeyObj = forge.default.pki.privateKeyFromPem(privateKey.value);
        } catch (error) {
            $toast.error(t('pages.crypt.pfx.parsePrivateKeyError') + ': ' + error.message, {
                position: "bottom-center",
            });
            return;
        }

        // Certificate parsen
        let certObj;
        try {
            certObj = forge.default.pki.certificateFromPem(certificate.value);
        } catch (error) {
            $toast.error(t('pages.crypt.pfx.parseCertificateError') + ': ' + error.message, {
                position: "bottom-center",
            });
            return;
        }

        // CA-Chain parsen (optional)
        const caCerts = [];
        if (caChain.value.trim()) {
            try {
                // CA-Chain kann mehrere Zertifikate enthalten
                const caChainPem = caChain.value.trim();
                const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
                const matches = caChainPem.match(certRegex);

                if (matches) {
                    for (const match of matches) {
                        try {
                            const caCert = forge.default.pki.certificateFromPem(match);
                            caCerts.push(caCert);
                        } catch (error) {
                            console.warn(t('pages.crypt.pfx.parseCaError'), error);
                        }
                    }
                } else {
                    // Versuche es als einzelnes Zertifikat zu parsen
                    const caCert = forge.default.pki.certificateFromPem(caChainPem);
                    caCerts.push(caCert);
                }
            } catch (error) {
                $toast.error(t('pages.crypt.pfx.parseCaChainError') + ': ' + error.message, {
                    position: "bottom-center",
                });
                return;
            }
        }

        // PKCS#12 erstellen
        const p12Asn1 = forge.default.pkcs12.toPkcs12Asn1(
            privateKeyObj,
            [certObj, ...caCerts],
            pfxPassword.value || ''
        );

        // PFX als DER konvertieren
        const p12Der = forge.default.asn1.toDer(p12Asn1).getBytes();

        // Download vorbereiten
        downloadPfx(p12Der);

        $toast.success(t('pages.crypt.pfx.createSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error(t('pages.crypt.pfx.createError') + ': ' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isWorking.value = false;
    }
};

const cancelPfxCreation = () => {
    showPasswordWarning.value = false;
};

const downloadPfx = (p12Der) => {
    // String zu Uint8Array konvertieren
    const bytes = new Uint8Array(p12Der.length);
    for (let i = 0; i < p12Der.length; i++) {
        bytes[i] = p12Der.charCodeAt(i);
    }

    // Blob erstellen
    const blob = new Blob([bytes], { type: 'application/x-pkcs12' });
    const url = window.URL.createObjectURL(blob);

    // Download-Link erstellen
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate.pfx';
    document.body.appendChild(a);
    a.click();

    // Aufräumen
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

const clearAll = () => {
    privateKey.value = '';
    certificate.value = '';
    caChain.value = '';
    pfxPassword.value = '';
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.crypt.pfx.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.pfx.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('common.privacy.notTransmitted') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.pfx.privateKey') }}</h3>
                        <textarea v-model="privateKey" class="w-100"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" rows="8"
                            :disabled="isWorking"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.pfx.privateKeyDesc') }}</small>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.pfx.certificate') }}</h3>
                        <textarea v-model="certificate" class="w-100"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" rows="8"
                            :disabled="isWorking"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.pfx.certificateDesc') }}</small>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.pfx.caChain') }}</h3>
                        <textarea v-model="caChain" class="w-100"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----&#10;-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            rows="8" :disabled="isWorking"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.pfx.caChainDesc') }}</small>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.pfx.options') }}</h3>
                        <VTextField v-model="pfxPassword" :label="t('pages.crypt.pfx.password')" type="password"
                            :placeholder="t('pages.crypt.pfx.passwordPlaceholder')" :disabled="isWorking" />
                        <small class="text-muted">{{ t('pages.crypt.pfx.passwordDesc') }}</small>
                    </VCol>
                    <VCol cols="12">
                        <VBtn color="primary" @click="createPfx"
                            :disabled="isWorking || !privateKey.trim() || !certificate.trim()" role="button">
                            <i class='bx bx-file me-2'></i>
                            {{ t('pages.crypt.pfx.create') }}
                        </VBtn>
                        <VBtn color="secondary" @click="clearAll" :disabled="isWorking" role="button" class="ms-2">
                            <i class='bx bx-trash me-2'></i>
                            {{ t('pages.crypt.pfx.clearAll') }}
                        </VBtn>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
        <div class="text-secondary mt-2">
            <small>Powered by <a href="https://github.com/digitalbazaar/forge" target="_blank">node-forge</a></small>
        </div>

        <!-- Warnung-Modal für fehlendes Passwort -->
        <VDialog v-model="showPasswordWarning" max-width="600" persistent>
            <VCard>
                <VCardTitle class="d-flex align-center mt-4">
                    <VIcon icon="bx-error-circle" color="warning" class="me-2" />
                    <span>{{ t('pages.crypt.pfx.noPasswordTitle') }}</span>
                </VCardTitle>
                <VCardText>
                    <p class="mb-3">
                        {{ t('pages.crypt.pfx.noPasswordMessage') }}
                    </p>
                    <p class="mb-3">
                        <strong>{{ t('common.note') }}:</strong> {{ t('pages.crypt.pfx.noPasswordNote') }}
                    </p>
                </VCardText>
                <VCardActions>
                    <VSpacer></VSpacer>
                    <VBtn color="secondary" @click="cancelPfxCreation" :disabled="isWorking">
                        {{ t('pages.crypt.pfx.cancel') }}
                    </VBtn>
                    <VBtn color="primary" @click="doCreatePfx" :disabled="isWorking">
                        {{ t('pages.crypt.pfx.createAnyway') }}
                    </VBtn>
                </VCardActions>
            </VCard>
        </VDialog>
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
