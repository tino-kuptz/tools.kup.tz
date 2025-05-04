<script setup>
const props = defineProps(['json']);

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
            Ungültiges JSON
        </v-card-title>

        <v-card-text>
            Der Inhalt ist kein gültiges JSON. Bitte überprüfe den Inhalt und versuche es erneut.
        </v-card-text>
    </v-card>
    <v-card v-else>
        <v-card-title class="text-h5">
            JSON-Objekt
        </v-card-title>

        <v-card-subtitle>
            <v-switch v-model="passFullKey" label="Vollständigen Schlüsselpfad anzeigen" />
        </v-card-subtitle>

        <v-card-text>
            <ItemWrapper :item="data" item-name="" :pass-full-key="passFullKey" />
        </v-card-text>
    </v-card>
</template>
