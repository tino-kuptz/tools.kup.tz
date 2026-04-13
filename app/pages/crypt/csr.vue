<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.crypt.csr.title'),
    meta: [
        {
            description: t('pages.crypt.csr.description'),
        },
    ],
})

const { $toast } = useNuxtApp()

// Parsing
const csrInput = ref('');
const parsedCsr = ref(null);
const parsedCsrRaw = ref('');
const isParsing = ref(false);

// Generation
const privateKeyInput = ref('');
const csrForm = ref({
    commonName: '',
    organization: '',
    organizationalUnit: '',
    locality: '',
    state: '',
    country: '',
    emailAddress: '',
    keySize: 2048,
});
const generatedCsr = ref('');
const generatedPrivateKey = ref('');
const isGenerating = ref(false);

// Parse CSR
const parseCsr = async () => {
    if (!csrInput.value.trim()) {
        $toast.error(t('common.errors.pleaseEnterCsr'), {
            position: "bottom-center",
        });
        return;
    }

    isParsing.value = true;
    try {
        const forge = await import('node-forge');

        // Parse CSR
        const csr = forge.default.pki.certificationRequestFromPem(csrInput.value);

        // Extrahiere Informationen
        const subject = csr.subject;
        const publicKey = csr.publicKey;

        parsedCsr.value = {
            commonName: subject.getField('CN')?.value || '',
            organization: subject.getField('O')?.value || '',
            organizationalUnit: subject.getField('OU')?.value || '',
            locality: subject.getField('L')?.value || '',
            state: subject.getField('ST')?.value || '',
            country: subject.getField('C')?.value || '',
            emailAddress: subject.getField('E')?.value || subject.getField('emailAddress')?.value || '',
            keySize: publicKey.n.bitLength(),
            attributes: csr.attributes || [],
        };

        // Fülle Formularfelder mit geparsten Daten
        csrForm.value.commonName = parsedCsr.value.commonName;
        csrForm.value.organization = parsedCsr.value.organization;
        csrForm.value.organizationalUnit = parsedCsr.value.organizationalUnit;
        csrForm.value.locality = parsedCsr.value.locality;
        csrForm.value.state = parsedCsr.value.state;
        csrForm.value.country = parsedCsr.value.country;
        csrForm.value.emailAddress = parsedCsr.value.emailAddress;
        csrForm.value.keySize = parsedCsr.value.keySize;

        // Extrahiere detaillierte Public Key Informationen
        const modulus = publicKey.n.toString(16);
        const exponent = publicKey.e.toString(16);
        const modulusLength = publicKey.n.bitLength();
        const modulusByteLength = Math.ceil(modulusLength / 8);

        // Erstelle Rohformat mit allen Daten
        parsedCsrRaw.value = JSON.stringify({
            subject: {
                CN: parsedCsr.value.commonName,
                O: parsedCsr.value.organization,
                OU: parsedCsr.value.organizationalUnit,
                L: parsedCsr.value.locality,
                ST: parsedCsr.value.state,
                C: parsedCsr.value.country,
                emailAddress: parsedCsr.value.emailAddress,
            },
            publicKey: {
                algorithm: 'RSA',
                keySize: modulusLength,
                keySizeBits: modulusLength,
                keySizeBytes: modulusByteLength,
                modulus: {
                    hex: modulus,
                    length: modulus.length,
                },
                exponent: {
                    hex: exponent,
                    decimal: publicKey.e.toString(10),
                },
            },
            signature: {
                algorithm: csr.signatureOid || 'unknown',
            },
            attributes: parsedCsr.value.attributes,
            version: csr.version || 0,
        }, null, 2);

        // Lösche generiertes CSR wenn vorhanden
        generatedCsr.value = '';
        generatedPrivateKey.value = '';

        $toast.success(t('pages.crypt.csr.parseSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        parsedCsr.value = null;
        $toast.error(t('pages.crypt.csr.parseError') + ': ' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isParsing.value = false;
    }
};

// Generate CSR
const generateCsr = async () => {
    if (!csrForm.value.commonName.trim()) {
        $toast.error(t('pages.crypt.csr.commonNameDesc'), {
            position: "bottom-center",
        });
        return;
    }

    isGenerating.value = true;
    try {
        const forge = await import('node-forge');

        // Lösche geparstes CSR wenn vorhanden
        parsedCsr.value = null;

        let keyPair;

        // Verwende vorhandenen Private Key falls eingegeben, sonst generiere neuen
        if (privateKeyInput.value.trim()) {
            try {
                const privateKey = forge.default.pki.privateKeyFromPem(privateKeyInput.value);
                const publicKey = forge.default.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
                keyPair = {
                    privateKey: privateKey,
                    publicKey: publicKey,
                };
            } catch (error) {
                $toast.error(t('pages.crypt.csr.parsePrivateKeyError') + ': ' + error.message, {
                    position: "bottom-center",
                });
                return;
            }
        } else {
            // Generiere RSA Key Pair
            keyPair = forge.default.pki.rsa.generateKeyPair(csrForm.value.keySize);
            privateKeyInput.value = forge.default.pki.privateKeyToPem(keyPair.privateKey);
        }

        // Erstelle CSR
        const csr = forge.default.pki.createCertificationRequest();
        csr.publicKey = keyPair.publicKey;

        // Setze Subject
        csr.setSubject([
            { name: 'commonName', value: csrForm.value.commonName },
            ...(csrForm.value.organization ? [{ name: 'organizationName', value: csrForm.value.organization }] : []),
            ...(csrForm.value.organizationalUnit ? [{ name: 'organizationalUnitName', value: csrForm.value.organizationalUnit }] : []),
            ...(csrForm.value.locality ? [{ name: 'localityName', value: csrForm.value.locality }] : []),
            ...(csrForm.value.state ? [{ name: 'stateOrProvinceName', value: csrForm.value.state }] : []),
            ...(csrForm.value.country ? [{ name: 'countryName', value: csrForm.value.country }] : []),
            ...(csrForm.value.emailAddress ? [{ name: 'emailAddress', value: csrForm.value.emailAddress }] : []),
        ]);

        // Signiere CSR mit Private Key
        csr.sign(keyPair.privateKey);

        // Konvertiere zu PEM-Format
        const csrPem = forge.default.pki.certificationRequestToPem(csr);
        const privateKeyPem = forge.default.pki.privateKeyToPem(keyPair.privateKey);

        generatedCsr.value = csrPem;
        // Setze generiertes CSR auch in das Eingabefeld oben
        csrInput.value = csrPem;

        // Nur Private Key speichern wenn neu generiert wurde
        if (!privateKeyInput.value.trim()) {
            generatedPrivateKey.value = privateKeyPem;
        } else {
            generatedPrivateKey.value = privateKeyInput.value;
        }

        // Extrahiere detaillierte Public Key Informationen
        const modulus = keyPair.publicKey.n.toString(16);
        const exponent = keyPair.publicKey.e.toString(16);
        const modulusLength = keyPair.publicKey.n.bitLength();
        const modulusByteLength = Math.ceil(modulusLength / 8);

        // Erstelle Rohformat für generiertes CSR
        parsedCsrRaw.value = JSON.stringify({
            subject: {
                CN: csrForm.value.commonName,
                O: csrForm.value.organization || null,
                OU: csrForm.value.organizationalUnit || null,
                L: csrForm.value.locality || null,
                ST: csrForm.value.state || null,
                C: csrForm.value.country || null,
                emailAddress: csrForm.value.emailAddress || null,
            },
            publicKey: {
                algorithm: 'RSA',
                keySize: modulusLength,
                keySizeBits: modulusLength,
                keySizeBytes: modulusByteLength,
                modulus: {
                    hex: modulus,
                    length: modulus.length,
                },
                exponent: {
                    hex: exponent,
                    decimal: keyPair.publicKey.e.toString(10),
                },
            },
            signature: {
                algorithm: csr.signatureOid || 'unknown',
            },
            version: csr.version || 0,
        }, null, 2);

        $toast.success(t('pages.crypt.csr.generateSuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error(t('pages.crypt.csr.generateError') + ': ' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isGenerating.value = false;
    }
};

const clearParsed = () => {
    parsedCsr.value = null;
    parsedCsrRaw.value = '';
    csrInput.value = '';
    // Lösche auch generiertes CSR wenn vorhanden
    if (generatedCsr.value) {
        generatedCsr.value = '';
        generatedPrivateKey.value = '';
    }
};

const clearGenerated = () => {
    generatedCsr.value = '';
    generatedPrivateKey.value = '';
    privateKeyInput.value = '';
    parsedCsrRaw.value = '';
    csrForm.value = {
        commonName: '',
        organization: '',
        organizationalUnit: '',
        locality: '',
        state: '',
        country: '',
        emailAddress: '',
        keySize: 2048,
    };
};

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        $toast.success(t('pages.crypt.csr.copySuccess'), {
            position: "bottom-center",
        });
    } catch (error) {
        $toast.error(t('pages.crypt.csr.copyError'), {
            position: "bottom-center",
        });
    }
};

// Generiere RSA Private Key
const generateRsaKey = async (keySize) => {
    isGenerating.value = true;
    try {
        const forge = await import('node-forge');

        // Generiere RSA Key Pair
        const keyPair = forge.default.pki.rsa.generateKeyPair(keySize);

        // Konvertiere Private Key zu PEM-Format
        const privateKeyPem = forge.default.pki.privateKeyToPem(keyPair.privateKey);

        // Setze Private Key in Input-Feld
        privateKeyInput.value = privateKeyPem;

        $toast.success(t('pages.crypt.csr.generateRsaSuccess', { size: keySize }), {
            position: "bottom-center",
        });
    } catch (error) {
        console.error(error);
        $toast.error(t('pages.crypt.csr.generateRsaError') + ': ' + error.message, {
            position: "bottom-center",
        });
    } finally {
        isGenerating.value = false;
    }
};
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.crypt.csr.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.crypt.csr.descriptionText') }}
                    </div>
                    <div class="text-h6 mb-1">
                        <small>
                            {{ t('pages.crypt.csr.descriptionGenerate') }}
                        </small>
                    </div>
                    <div class="text-h6 mb-1">
                        <small>
                            {{ t('pages.crypt.csr.descriptionParse') }}
                        </small>
                    </div>
                    <div class="text-h6 mb-1">
                        <strong>{{ t('pages.crypt.csr.descriptionPrivacy') }}</strong>
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <!-- Obere Reihe: CSR Input und Private Key Input -->
        <VCard class="mb-4">
            <VCardText class="p-2">
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-0">{{ t('pages.crypt.csr.csr') }}</h3>
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.csrDesc') }}</small>
                        <textarea v-model="csrInput" class="w-100"
                            placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;...&#10;-----END CERTIFICATE REQUEST-----"
                            rows="8" :disabled="isParsing"></textarea>
                        <small class="text-muted">{{ t('pages.crypt.csr.csrPlaceholder') }}</small>
                        <div class="mt-2">
                            <VBtn color="primary" @click="parseCsr" :disabled="isParsing || !csrInput.trim()"
                                role="button" size="small">
                                <i class='bx bx-search me-2'></i>
                                {{ t('pages.crypt.csr.parse') }}
                            </VBtn>
                            <VBtn color="secondary" @click="clearParsed" :disabled="isParsing || !parsedCsr"
                                role="button" class="ms-2" size="small">
                                <i class='bx bx-trash me-2'></i>
                                {{ t('pages.crypt.csr.reset') }}
                            </VBtn>
                        </div>
                    </VCol>
                    <VCol cols="12" md="6">
                        <h3 class="mb-0">{{ t('pages.crypt.csr.rsaPrivateKey') }}</h3>
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.rsaPrivateKeyDesc') }}</small>
                        <textarea v-model="privateKeyInput" class="w-100"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----" rows="8"
                            :disabled="isGenerating"></textarea>
                        <small class="text-muted d-block mb-2">{{ t('pages.crypt.csr.rsaPrivateKeyNote') }}</small>
                        <v-menu>
                            <template v-slot:activator="{ props }">
                                <VBtn color="primary" v-bind="props" :disabled="isGenerating" size="small">
                                    <i class='bx bx-key me-2'></i>
                                    {{ t('pages.crypt.csr.generateRsaKey') }}
                                </VBtn>
                            </template>
                            <v-list>
                                <v-list-item @click="generateRsaKey(1024)">
                                    <v-list-item-title>1024 Bit</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="generateRsaKey(2048)">
                                    <v-list-item-title>2048 Bit</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="generateRsaKey(4096)">
                                    <v-list-item-title>4096 Bit</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>

        <!-- Zweite Reihe: Formularfelder links, CSR Rohformat rechts -->
        <VCard>
            <VCardTitle>
                <h3 class="mb-3">{{ t('pages.crypt.csr.createCsr') }}</h3>
            </VCardTitle>
            <VCardText class="p-2">
                <VRow>
                    <!-- Links: Formularfelder -->
                    <VCol cols="12" md="6">
                        <VTextField v-model="csrForm.commonName" :label="t('pages.crypt.csr.commonName')"
                            placeholder="example.com" :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.commonNameDesc') }}</small>

                        <VTextField v-model="csrForm.organization" :label="t('pages.crypt.csr.organization')"
                            placeholder="Tino Kuptz" :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.organizationDesc') }}</small>

                        <VTextField v-model="csrForm.organizationalUnit"
                            :label="t('pages.crypt.csr.organizationalUnit')" placeholder="SSL Management Division"
                            :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.organizationalUnitDesc') }}</small>

                        <VTextField v-model="csrForm.locality" :label="t('pages.crypt.csr.locality')"
                            placeholder="Einfeld" :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.localityDesc') }}</small>

                        <VTextField v-model="csrForm.state" :label="t('pages.crypt.csr.state')"
                            placeholder="Schleswig-Holstein" :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.stateDesc') }}</small>

                        <VTextField v-model="csrForm.country" :label="t('pages.crypt.csr.country')" placeholder="DE"
                            maxlength="2" :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.countryDesc') }}</small>

                        <VTextField v-model="csrForm.emailAddress" :label="t('pages.crypt.csr.emailAddress')"
                            placeholder="admin@kup.tz" type="email" :disabled="isGenerating" variant="outlined" />
                        <small class="text-muted d-block mb-3">{{ t('pages.crypt.csr.emailAddressDesc') }}</small>

                        <VBtn color="primary" @click="generateCsr"
                            :disabled="isGenerating || !csrForm.commonName.trim()" role="button" class="mt-2">
                            <i class='bx bx-file me-2'></i>
                            {{ t('pages.crypt.csr.generate') }}
                        </VBtn>
                        <VBtn color="secondary" @click="clearGenerated" :disabled="isGenerating || !generatedCsr"
                            role="button" class="ms-2 mt-2">
                            <i class='bx bx-trash me-2'></i>
                            {{ t('pages.crypt.csr.reset') }}
                        </VBtn>
                    </VCol>

                    <!-- Rechts: CSR Rohformat -->
                    <VCol cols="12" md="6">
                        <h3 class="mb-3">{{ t('pages.crypt.csr.rawFormatTitle') }}</h3>
                        <div v-if="parsedCsrRaw">
                            <textarea v-model="parsedCsrRaw" class="w-100" rows="20" readonly></textarea>
                            <VBtn color="primary" @click="copyToClipboard(parsedCsrRaw)" class="mt-2" size="small">
                                <i class='bx bx-copy me-2'></i>
                                {{ t('common.copy') }}
                            </VBtn>
                        </div>
                        <div v-else-if="generatedCsr">
                            <textarea v-model="generatedCsr" class="w-100" rows="20" readonly></textarea>
                            <VBtn color="primary" @click="copyToClipboard(generatedCsr)" class="mt-2" size="small">
                                <i class='bx bx-copy me-2'></i>
                                {{ t('common.copy') }}
                            </VBtn>
                        </div>
                        <div v-else class="text-muted">
                            <p>{{ t('pages.crypt.csr.rawFormat') }}</p>
                        </div>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
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
