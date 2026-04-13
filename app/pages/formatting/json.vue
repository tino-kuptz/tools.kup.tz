<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.formatting.json.title'),
    meta: [
        {
            description: t('pages.formatting.json.description'),
        },
    ],
})

const json = ref(`{
  "tools": [
    {
      "name": "This might be a tool",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "read_count": 15
    },
    {
      "name": "This might be a different tool",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "read_count": 22
    }
  ]
}`);

const { $toast } = useNuxtApp()

const format = () => {
    try {
        const data = JSON.parse(json.value);
        if (!data) {
            $toast.error(t('common.errors.invalidJson'), {
                position: "bottom-center",
            })
            return;
        }
        json.value = JSON.stringify(data, null, 2);
        $toast.success(t('common.errors.jsonFormatted'), {
            position: "bottom-center",
        })
    } catch (e) {
        $toast.error(t('common.errors.invalidJson') + '\n' + e.message, {
            position: "bottom-center",
        })
    }
}

import ObjectTreeMain from '~/components/tools/json-formatter/ObjectTreeMain.vue';
</script>
<template>
    <div>
        <h2 class="mb-2">{{ t('pages.formatting.json.heading') }}</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        {{ t('common.about') }}
                    </div>
                    <div class="text-h6 mb-1">
                        {{ t('pages.formatting.json.descriptionText') }}
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VRow>
            <VCol cols="12" lg="4">
                <VCard>
                    <VCardText class="px-2">
                        <h3 class="mb-3">{{ t('pages.formatting.json.jsonText') }}</h3>
                        <textarea v-model="json" class="form-control w-100"
                            :placeholder="t('pages.formatting.json.placeholder')"></textarea>
                    </VCardText>
                    <VCardActions>
                        <VBtn @click="format" color="primary" class="w-100">
                            {{ t('pages.formatting.json.formatButton') }}
                        </VBtn>
                    </VCardActions>
                </VCard>

            </VCol>
            <VCol cols="12" lg="8">
                <ObjectTreeMain :json="json" />
            </VCol>
        </VRow>
    </div>
</template>
<style scoped>
textarea {
    width: 100%;
    min-height: 450px;
    font-family: monospace, monospace;
    overflow: scroll;
    line-break: unset;
    white-space: nowrap;
}
</style>
