<script setup>
const props = defineProps(['item', 'item-name', 'pass-full-key']);

const itemType = computed(() => {
    if (Array.isArray(props.item)) {
        return 'array';
    }
    if (typeof props.item === 'object' && props.item !== null) {
        return 'object';
    }
    return typeof props.item;
});

const isExpanded = ref(true);

import ItemWrapper from './ItemWrapper.vue';
</script>
<template>
    <!-- Array -->
    <div v-if="itemType == 'array'">
        <template v-if="itemName.length >= 1"><code>{{ itemName }}:</code></template>
        <v-chip>array ({{ item.length }})</v-chip> <code>[</code>
        <span v-if="isExpanded" @click="isExpanded = false" role="button">
            -
        </span>
        <span v-else @click="isExpanded = true" role="button">
            +
        </span>
        <v-list v-if="isExpanded" class="ps-4">
            <v-list-item-group v-for="(item, index) in item" :key="index">
                <ItemWrapper :item="item"
                    :item-name="`${passFullKey && itemName.length >= 1 ? itemName : ''}[${index}]`"
                    :pass-full-key="passFullKey" />
            </v-list-item-group>
        </v-list>
        <code>]</code>
    </div>
    <!-- Object -->
    <div v-else-if="itemType == 'object'">
        <template v-if="itemName.length >= 1"><code>{{ itemName }}:</code></template>
        <v-chip>object</v-chip> <code>{</code>
        <span v-if="isExpanded" @click="isExpanded = false" role="button">
            -
        </span>
        <span v-else @click="isExpanded = true" role="button">
            +
        </span>
        <v-list v-if="isExpanded" class="ps-4">
            <v-list-item-group v-for="(value, key) in item" :key="key">
                <ItemWrapper :item="value"
                    :item-name="`${passFullKey && itemName.length >= 1 ? itemName + '.' : ''}${key}`"
                    :pass-full-key="passFullKey" />
            </v-list-item-group>
        </v-list>
        <code>}</code>
    </div>
    <!-- String -->
    <div v-else-if="itemType == 'string'">
        <template v-if="itemName.length >= 1"><code>{{ itemName }}</code>:</template> <code class="text-blue">"{{
            item }}"</code>
    </div>
    <!-- Number -->
    <div v-else-if="itemType == 'number'">
        <template v-if="itemName.length >= 1"><code>{{ itemName }}</code>:</template> <code>{{ item }}</code>
    </div>
</template>
<style scoped>
.text-blue {
    color: #2196f3;
}
</style>
