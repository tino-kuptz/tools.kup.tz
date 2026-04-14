<script setup>
const { t, locale } = useI18n();

useCustomI18nHead({
    title: t('pages.network.subnet.title'),
    meta: [
        {
            description: t('pages.network.subnet.description'),
        },
    ],
})

// Input values
const ipAddress = ref('');
const prefixLength = ref('');
const subnetMask = ref('');

// Computed subnet info
const subnetInfo = computed(() => {
    if (!ipAddress.value || (!prefixLength.value && !subnetMask.value)) {
        return null;
    }

    try {
        let prefix = 0;
        let mask = '';

        // Determine prefix and mask
        if (prefixLength.value) {
            prefix = parseInt(prefixLength.value);
            if (prefix < 0 || prefix > 32) return null;
            mask = prefixToSubnetMask(prefix);
        } else if (subnetMask.value) {
            mask = subnetMask.value;
            prefix = subnetMaskToPrefix(mask);
            if (prefix === null) return null;
        } else {
            return null;
        }

        // Validate IP
        if (!isValidIP(ipAddress.value)) return null;

        // Calculate subnet
        const ipParts = ipAddress.value.split('.').map(Number);
        const maskParts = mask.split('.').map(Number);

        const networkParts = ipParts.map((part, i) => part & maskParts[i]);
        const network = networkParts.join('.');

        // Calculate broadcast
        const broadcastParts = ipParts.map((part, i) => part | (~maskParts[i] & 0xFF));
        const broadcast = broadcastParts.join('.');

        // Calculate first and last usable IP
        const firstIP = networkParts.map((part, i) => i === 3 ? part + 1 : part).join('.');
        const lastIP = broadcastParts.map((part, i) => i === 3 ? part - 1 : part).join('.');

        // Calculate number of hosts
        const hostBits = 32 - prefix;
        const totalHosts = Math.pow(2, hostBits);
        const usableHosts = totalHosts - 2;

        return {
            network,
            firstIP,
            lastIP,
            broadcast,
            prefix,
            mask,
            totalHosts,
            usableHosts,
        };
    } catch (e) {
        return null;
    }
});

// Split subnet selection
const splitCount = ref(null);
const splitOptions = [2, 4, 8, 16, 32, 64, 128, 256];

// Computed available split options (disabled if not technically possible)
const availableSplitOptions = computed(() => {
    if (!subnetInfo.value) {
        return splitOptions.map(opt => ({ value: opt, title: opt.toString(), disabled: true }));
    }

    const originalPrefix = subnetInfo.value.prefix;
    return splitOptions.map(opt => {
        const bitsNeeded = Math.log2(opt);
        const newPrefix = originalPrefix + bitsNeeded;
        const disabled = newPrefix > 32;
        return {
            value: opt,
            title: opt.toString(),
            disabled: disabled
        };
    });
});

// Quick select presets
const quickSelectPresets = [
    { ip: '127.0.0.0', prefix: 8, label: { de: 'Lokal', en: 'Local' } },
    { ip: '10.0.0.0', prefix: 8, label: { de: 'Privat, Klasse A', en: 'Private, Class A' } },
    { ip: '100.64.0.0', prefix: 10, label: { de: 'CGN', en: 'CGN' } },
    { ip: '172.16.0.0', prefix: 12, label: { de: 'Privat, Klasse B', en: 'Private, Class B' } },
    { ip: '192.168.0.0', prefix: 16, label: { de: 'Privat, Klasse C', en: 'Private, Class C' } },
];

const selectPreset = (preset) => {
    ipAddress.value = preset.ip;
    prefixLength.value = preset.prefix.toString();
};

// Computed split subnets
const splitSubnets = computed(() => {
    if (!splitCount.value || !subnetInfo.value) {
        return [];
    }

    const count = parseInt(splitCount.value);
    if (!splitOptions.includes(count)) return [];

    // Calculate new prefix length
    const originalPrefix = subnetInfo.value.prefix;
    const bitsNeeded = Math.log2(count);
    if (!Number.isInteger(bitsNeeded)) return [];

    const newPrefix = originalPrefix + bitsNeeded;
    if (newPrefix > 32) return [];

    const newMask = prefixToSubnetMask(newPrefix);
    const networkParts = subnetInfo.value.network.split('.').map(Number);
    const subnetSize = Math.pow(2, 32 - newPrefix);

    const subnets = [];
    const baseNetworkInt = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];

    for (let i = 0; i < count; i++) {
        const subnetOffset = i * subnetSize;
        const subnetNetworkInt = baseNetworkInt + subnetOffset;

        const networkOctets = [
            (subnetNetworkInt >>> 24) & 0xFF,
            (subnetNetworkInt >>> 16) & 0xFF,
            (subnetNetworkInt >>> 8) & 0xFF,
            subnetNetworkInt & 0xFF
        ];

        const network = networkOctets.join('.');

        const broadcastInt = subnetNetworkInt + subnetSize - 1;
        const broadcastOctets = [
            (broadcastInt >>> 24) & 0xFF,
            (broadcastInt >>> 16) & 0xFF,
            (broadcastInt >>> 8) & 0xFF,
            broadcastInt & 0xFF
        ];
        const broadcast = broadcastOctets.join('.');

        const firstIP = [
            networkOctets[0],
            networkOctets[1],
            networkOctets[2],
            networkOctets[3] + 1
        ].join('.');

        const lastIP = [
            broadcastOctets[0],
            broadcastOctets[1],
            broadcastOctets[2],
            broadcastOctets[3] - 1
        ].join('.');

        subnets.push({
            network: `${network}/${newPrefix}`,
            firstIP,
            lastIP,
            broadcast,
        });
    }

    return subnets;
});

// Helper functions
function isValidIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
        const num = parseInt(part);
        return !isNaN(num) && num >= 0 && num <= 255;
    });
}

function prefixToSubnetMask(prefix) {
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
    return [
        (mask >>> 24) & 0xFF,
        (mask >>> 16) & 0xFF,
        (mask >>> 8) & 0xFF,
        mask & 0xFF
    ].join('.');
}

function subnetMaskToPrefix(mask) {
    if (!isValidIP(mask)) return null;

    const parts = mask.split('.').map(Number);
    const binary = parts.map(part => part.toString(2).padStart(8, '0')).join('');

    // Check if it's a valid subnet mask (all 1s followed by all 0s)
    const firstZero = binary.indexOf('0');
    if (firstZero === -1) return 32;
    if (binary.substring(firstZero).includes('1')) return null;

    return firstZero;
}

// Watch for changes to sync prefix and subnet mask
watch(prefixLength, (newVal) => {
    if (newVal && !isNaN(newVal)) {
        const prefix = parseInt(newVal);
        if (prefix >= 0 && prefix <= 32) {
            subnetMask.value = prefixToSubnetMask(prefix);
        }
    }
});

watch(subnetMask, (newVal) => {
    if (newVal) {
        const prefix = subnetMaskToPrefix(newVal);
        if (prefix !== null) {
            prefixLength.value = prefix.toString();
        }
    }
});
</script>

<template>
    <div>
        <h2 class="mb-2">{{ t('pages.network.subnet.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('pages.network.subnet.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.network.subnet.description1') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.network.subnet.description2') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <h3 class="mb-3">{{ t('pages.network.subnet.input') }}</h3>
                <p class="mb-4">
                    {{ t('pages.network.subnet.inputDescription') }}
                </p>

                <VRow>
                    <VCol cols="12" md="4">
                        <VRow>
                            <VCol cols="12" sm="8">
                                <VTextField v-model="ipAddress" :label="t('pages.network.subnet.ipAddress')"
                                    placeholder="192.168.1.1" variant="outlined" />
                            </VCol>
                            <VCol cols="12" sm="4">
                                <VTextField v-model="prefixLength" :label="t('pages.network.subnet.prefix')"
                                    placeholder="24" variant="outlined" prefix="/" />
                            </VCol>
                        </VRow>
                    </VCol>
                    <VCol cols="12" md="3" class="ms-auto">
                        <VTextField v-model="subnetMask" :label="t('pages.network.subnet.subnetMask')"
                            placeholder="255.255.255.0" variant="outlined" />
                    </VCol>
                </VRow>

                <div class="mt-4">
                    <div class="text-caption text-medium-emphasis mb-2">
                        {{ t('pages.network.subnet.quickSelect') }}
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        <VChip v-for="preset in quickSelectPresets" :key="preset.ip" @click="selectPreset(preset)"
                            variant="outlined" style="cursor: pointer;">
                            {{ preset.label[locale] || preset.label.de }} ({{ preset.ip }}/{{ preset.prefix }})
                        </VChip>
                    </div>
                </div>
            </VCardText>

            <VCardText v-if="subnetInfo">
                <VCard variant="outlined" class="mb-4">
                    <VCardText>
                        <VRow>
                            <VCol cols="12" sm="6" md="4" class="order-1 order-sm-1">
                                <div>
                                    <div class="text-caption text-medium-emphasis mb-1">
                                        {{ t('pages.network.subnet.table.subnet') }}
                                    </div>
                                    <div class="text-body-1">
                                        <code>{{ `${subnetInfo.network}/${subnetInfo.prefix}` }}</code>
                                    </div>
                                </div>
                            </VCol>
                            <VCol cols="12" sm="6" md="4" class="order-2 order-sm-3">
                                <div>
                                    <div class="text-caption text-medium-emphasis mb-1">
                                        {{ t('pages.network.subnet.table.broadcast') }}
                                    </div>
                                    <div class="text-body-1">
                                        <code>{{ subnetInfo.broadcast }}</code>
                                    </div>
                                </div>
                            </VCol>
                            <VCol cols="12" sm="6" md="4" class="order-3 order-sm-2">
                                <div>
                                    <div class="text-caption text-medium-emphasis mb-1">
                                        {{ t('pages.network.subnet.table.firstIP') }}
                                    </div>
                                    <div class="text-body-1">
                                        <code>{{ subnetInfo.firstIP }}</code>
                                    </div>
                                </div>
                            </VCol>
                            <VCol cols="12" sm="6" md="4" class="order-4 order-sm-4">
                                <div>
                                    <div class="text-caption text-medium-emphasis mb-1">
                                        {{ t('pages.network.subnet.table.lastIP') }}
                                    </div>
                                    <div class="text-body-1">
                                        <code>{{ subnetInfo.lastIP }}</code>
                                    </div>
                                </div>
                            </VCol>
                        </VRow>
                    </VCardText>
                </VCard>

                <div class="mb-4 d-flex align-center flex-wrap gap-2">
                    <span class="text-body-1">{{ t('pages.network.subnet.splitLabel') }}</span>
                    <VSelect v-model="splitCount" :items="availableSplitOptions" variant="outlined" clearable
                        density="compact" hide-details style="max-width: 120px;" />
                    <span class="text-body-1">{{ t('pages.network.subnet.splitSuffix') }}</span>
                </div>

                <div v-if="splitSubnets.length > 0">
                    <h3 class="mb-3">{{ t('pages.network.subnet.splitSubnets') }}</h3>

                    <VDataTable :headers="[
                        { title: t('pages.network.subnet.table.subnet'), value: 'network' },
                        { title: t('pages.network.subnet.table.firstIP'), value: 'firstIP' },
                        { title: t('pages.network.subnet.table.lastIP'), value: 'lastIP' },
                        { title: t('pages.network.subnet.table.broadcast'), value: 'broadcast' },
                    ]" :items="splitSubnets" class="elevation-1">
                        <template #item.network="{ item }">
                            <code>{{ item.network }}</code>
                        </template>
                        <template #item.firstIP="{ item }">
                            <code>{{ item.firstIP }}</code>
                        </template>
                        <template #item.lastIP="{ item }">
                            <code>{{ item.lastIP }}</code>
                        </template>
                        <template #item.broadcast="{ item }">
                            <code>{{ item.broadcast }}</code>
                        </template>
                    </VDataTable>
                </div>
            </VCardText>
        </VCard>
    </div>
</template>

<style scoped>
code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 3px;
}
</style>
