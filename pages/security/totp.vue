<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.security.totp.title'),
    meta: [
        {
            description: t('pages.security.totp.description'),
        },
    ],
});

import QRCode from 'qrcode';

const secret = ref('');
const label = ref('');
const digits = ref(6);
const period = ref(30);
const algorithm = ref('SHA-1'); // 'SHA-1' | 'SHA-256' | 'SHA-512'
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const now = ref(Date.now());
const code = ref('------');
const isClient = ref(false);
const qrCodeUrl = ref('');
let timer = null;

const { $toast } = useNuxtApp();

onMounted(() => {
    isClient.value = true;
    timer = setInterval(() => {
        now.value = Date.now();
        updateCode();
    }, 1000);
    updateCode();
    secret.value = (() => {
        var ret = "";
        for (var i = 0; i < 16; i++) {
            ret += base32Alphabet[Math.floor(Math.random() * base32Alphabet.length)];
        }
        return ret;
    })();
    generateQRCode();
});

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});

const secondsRemaining = computed(() => {
    const s = Math.floor(now.value / 1000);
    return period.value - (s % period.value);
});

const progress = computed(() => {
    return (secondsRemaining.value / period.value) * 100;
});

const copyCode = async () => {
    try {
        await navigator.clipboard.writeText(code.value);
        $toast && $toast.success(t('pages.security.totp.copySuccess'), { position: 'bottom-center' });
    } catch (e) {
        $toast && $toast.error(t('pages.security.totp.copyError'), { position: 'bottom-center' });
    }
};

const sanitizeBase32 = (s) => s.replace(/\s+/g, '').toUpperCase();

const base32ToBytes = (input) => {
    const clean = sanitizeBase32(input);
    const bytes = [];
    let bits = 0;
    let value = 0;
    for (let i = 0; i < clean.length; i++) {
        const idx = base32Alphabet.indexOf(clean[i]);
        if (idx === -1) continue;
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return new Uint8Array(bytes);
};

const numberTo8ByteArray = (num) => {
    const bytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
        bytes[i] = num & 0xff;
        num = Math.floor(num / 256);
    }
    return bytes;
};

let cached = { key: null, cacheKey: '' };

const getHmac = async (keyBytes, msgBytes, algo) => {
    const cacheKey = algo + ':' + Array.from(keyBytes).join(',');
    if (!cached.key || cached.cacheKey !== cacheKey) {
        cached.key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'HMAC', hash: { name: algo } },
            false,
            ['sign']
        );
        cached.cacheKey = cacheKey;
    }
    const sig = await crypto.subtle.sign('HMAC', cached.key, msgBytes);
    return new Uint8Array(sig);
};

const truncateToCode = (hmac, digitsVal) => {
    const offset = hmac[hmac.length - 1] & 0x0f;
    const p = ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);
    const mod = 10 ** digitsVal;
    const num = p % mod;
    return num.toString().padStart(digitsVal, '0');
};

const updateCode = async () => {
    if (!isClient.value) return;
    if (!secret.value) { code.value = '------'; return; }
    try {
        const t = Math.floor((Date.now() / 1000) / period.value);
        const counter = numberTo8ByteArray(t);
        const keyBytes = base32ToBytes(secret.value);
        const algoMap = { 'SHA-1': 'SHA-1', 'SHA-256': 'SHA-256', 'SHA-512': 'SHA-512' };
        const mac = await getHmac(keyBytes, counter, algoMap[algorithm.value]);
        code.value = truncateToCode(mac, digits.value);
    } catch (e) {
        code.value = t('pages.security.totp.error');
    }
};

const generateQRCode = async () => {
    if (!isClient.value || !secret.value) return;

    try {
        // Generate otpauth:// URL for TOTP
        const issuer = encodeURIComponent(label.value);
        const secretParam = encodeURIComponent(secret.value);
        const algorithmParam = algorithm.value.replace('SHA-', 'SHA').toLowerCase();
        const digitsParam = digits.value;
        const periodParam = period.value;

        const otpauthUrl = `otpauth://totp/${issuer}:?secret=${secretParam}&issuer=${issuer}&algorithm=${algorithmParam}&digits=${digitsParam}&period=${periodParam}`;

        // Generate QR code using qrcode library
        qrCodeUrl.value = await QRCode.toDataURL(otpauthUrl, {
            width: 200,
            height: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        qrCodeUrl.value = '';
    }
};

watch([secret, digits, period, algorithm, label], () => {
    updateCode();
    generateQRCode();
});
</script>

<template>
    <div>
        <h2 class="mb-2">{{ t('pages.security.totp.heading') }}</h2>
        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">{{ t('common.about') }}</div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.security.totp.descriptionText') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>
        <VRow>
            <VCol cols="12" md="6">
                <VCard>
                    <VCardText>
                        <div class="px-4">
                            <VRow>
                                <VCol cols="12">
                                    <VTextField v-model="label" :label="t('pages.security.totp.label')"
                                        :placeholder="t('pages.security.totp.labelPlaceholder')" />
                                </VCol>
                                <VCol cols="12">
                                    <VTextField v-model="secret" :label="t('pages.security.totp.secret')"
                                        :placeholder="t('pages.security.totp.secretPlaceholder')" />
                                </VCol>
                                <VCol cols="6">
                                    <VSelect v-model="digits" :items="[6, 8]"
                                        :label="t('pages.security.totp.digits')" />
                                </VCol>
                                <VCol cols="6">
                                    <VSelect v-model="period" :items="[15, 30, 45, 60]"
                                        :label="t('pages.security.totp.period')" />
                                </VCol>
                                <VCol cols="12">
                                    <VSelect v-model="algorithm" :items="['SHA-1', 'SHA-256', 'SHA-512']"
                                        :label="t('pages.security.totp.algorithm')" />
                                </VCol>
                            </VRow>

                            <div class="mt-12 d-flex text-center justify-center align-center flex-column">
                                <div class="display-1 text-mono"
                                    style="font-variant-numeric: tabular-nums; font-size: 3rem;">
                                    {{ code }}
                                </div>
                                <VBtn class="mt-8" color="primary" variant="tonal" size="small" @click="copyCode">
                                    {{ t('pages.security.totp.copy') }}
                                </VBtn>
                            </div>

                            <div class="mt-5 d-flex align-center">
                                <VProgressLinear :model-value="progress" height="10" color="primary" class="me-3"
                                    style="flex:1" />
                                <div class="text-caption">{{ secondsRemaining }}s</div>
                            </div>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
            <VCol cols="12" md="6">
                <VCard>
                    <VCardText>
                        <div class="px-4 text-center">
                            <h3 class="mb-4">{{ t('pages.security.totp.qrCode') }}</h3>
                            <div v-if="qrCodeUrl" class="d-flex justify-center mb-4">
                                <img :src="qrCodeUrl" :alt="t('pages.security.totp.qrCode')" width="200" height="200"
                                    style="border: 1px solid #ccc;" />
                            </div>
                            <div v-else class="d-flex justify-center mb-4">
                                <div
                                    style="width: 200px; height: 200px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                                    <span class="text-caption">{{ t('pages.security.totp.qrCodeGenerating') }}</span>
                                </div>
                            </div>
                            <div class="text-caption">
                                {{ t('pages.security.totp.scanQrCode') }}
                            </div>
                            <div class="mt-4">
                                <VBtn color="primary" variant="outlined" size="small" @click="generateQRCode">
                                    {{ t('pages.security.totp.regenerateQrCode') }}
                                </VBtn>
                            </div>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
        </VRow>
        <small class="text-muted d-block mt-3">
            Powered by <a href="https://www.npmjs.com/package/qrcode">qrcode</a>.
        </small>
    </div>
</template>

<style scoped>
.text-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
