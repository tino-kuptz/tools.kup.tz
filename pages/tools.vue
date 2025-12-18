<script setup>
const { t, locale } = useI18n();

useCustomI18nHead({
  title: t('pages.tools.title'),
  meta: [
    {
      description: t('pages.tools.description'),
    },
  ],
})

const prefix = computed(() => locale.value === 'de' ? '' : '/en');
</script>

<template>
  <div>
    <div v-for="(category, index) in get_tools_categories(locale.value)" :key="index">
      <h2 class="mt-4 mb-2">{{ category }}</h2>
      <VRow>
        <VCol cols="12" lg="4" md="6" v-for="(item, index) in get_tools_by_category(category, locale.value)"
          :key="index">
          <VCard class="h-100">
            <VCardItem>
              <VCardTitle class="my-0">
                <div class="d-flex justify-space-between">
                  <span>{{ item.name }}</span>
                  <v-chip v-if="item.tokens >= 1">{{ t('common.token') }}</v-chip>
                </div>
              </VCardTitle>
            </VCardItem>
            <VCardText class="d-flex">
              <span class="flex-fill">
                {{ item.description }}
              </span>
            </VCardText>

            <VCardActions>
              <VBtn :to="`${prefix}${item.link}`" text>{{ t('pages.tools.button') }}</VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </div>
</template>
