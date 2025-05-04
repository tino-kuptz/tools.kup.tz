<script setup>
//import { get_tools_categories, get_tools_bycategory } from '@/api/tools'
useHead({
  title: 'Werkzeugkasten',
  meta: [
    {
      description: 'Diese Seite bietet eine Sammlung von Werkzeugen, die helfen, die eigene Arbeit zu erledigen.',
    },
  ],
})
</script>

<template>
  <div>
    <div v-for="(category, index) in get_tools_categories()" :key="index">
      <h2 class="mt-4 mb-2">{{ category }}</h2>
      <VRow>
        <!-- 👉 Influencing The Influencer -->
        <VCol cols="12" lg="4" md="6" v-for="(item, index) in get_tools_by_category(category)" :key="index">
          <VCard>
            <VCardItem>
              <VCardTitle class="my-0">
                <div class="d-flex justify-space-between">
                  <span>{{ item.name }}</span>
                  <v-chip v-if="item.tokens >= 1">Token</v-chip>
                </div>
              </VCardTitle>
            </VCardItem>
            <VCardText class="d-flex">
              <span class="flex-fill">
                {{ item.description }}
              </span>
            </VCardText>

            <VCardActions>
              <VBtn :to="item.link" text>Zum Tool</VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </div>
</template>
