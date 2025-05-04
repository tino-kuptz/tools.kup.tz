<script setup>
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
            $toast.error('Ungültiges JSON', {
                position: "bottom-center",
            })
            return;
        }
        json.value = JSON.stringify(data, null, 2);
        $toast.success('JSON wurde formattiert', {
            position: "bottom-center",
        })
    } catch (e) {
        $toast.error('Ungültiges JSON\n' + e.message, {
            position: "bottom-center",
        })
    }
}

import ObjectTreeMain from '~/components/tools/json-formatter/ObjectTreeMain.vue'
</script>
<template>
    <div>
        <h2 class="mb-2">JSON Formatter</h2>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Mit diesem Tool können Sie JSON-Daten formatieren und lesbar machen. Einfach den JSON-Text in
                        das Textfeld einfügen und auf "Format JSON" klicken. Das Tool wird den JSON-Text analysieren und
                        ihn in einem lesbaren Format ausgeben.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VRow>
            <VCol cols="12" lg="4">
                <VCard>
                    <VCardText class="px-2">
                        <h3 class="mb-3">JSON Text</h3>
                        <textarea v-model="json" class="form-control w-100"
                            placeholder="Paste your JSON here"></textarea>
                    </VCardText>
                    <VCardActions>
                        <VBtn @click="format" color="primary" class="w-100">
                            Format JSON
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
