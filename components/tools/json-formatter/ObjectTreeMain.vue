<script setup>
const props = defineProps(['json']);
const { t } = useI18n();

const data = computed(() => {
    try {
        return JSON.parse(props.json);
    } catch (e) {
        return null;
    }
});

import ItemWrapper from './ItemWrapper.vue';

const passFullKey = ref(false);
</script>
<template>
    <v-card color="pink-darken-2" v-if="data === null">
        <v-card-title class="text-h5">
            {{ t('pages.formatting.json.invalidJson') }}
        </v-card-title>

        <v-card-text>
            {{ t('pages.formatting.json.invalidJsonMessage') }}
        </v-card-text>
    </v-card>
    <v-card v-else>
        <v-card-title class="text-h5">
            {{ t('pages.formatting.json.jsonObject') }}
        </v-card-title>

        <v-card-subtitle>
            <v-switch v-model="passFullKey" :label="t('pages.formatting.json.showFullKeyPath')" />
        </v-card-subtitle>

        <v-card-text>
            <ItemWrapper :item="data" item-name="" :pass-full-key="passFullKey" />
        </v-card-text>
    </v-card>
</template>
