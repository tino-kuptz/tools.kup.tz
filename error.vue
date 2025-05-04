<script setup>
const props = defineProps({
  error: {
    type: Object,
    required: true,
  },
})

defineOptions({
  inheritAttrs: false,
})

const isDev = process.dev

const errToShow = computed(() => {
  const is404 = props.error?.statusCode === 404 || props.error.message?.includes('404')

  if (is404) {
    return {
      title: 'Nicht gefunden',
      description: 'Die Seite existiert leider nicht.',
    }
  }

  else if (isDev) {
    return {
      title: props.error?.statusMessage,
      description: props.error.message,
    }
  }

  return {
    title: 'Oops! Something went wrong.',
    description: 'We are working on it and we\'ll get it fixed as soon as we can',
  }
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout name="blank">
    <div class="misc-wrapper">
      <ErrorHeader :status-code="props.error.statusCode" :title="errToShow.title"
        :description="errToShow.description" />

      <!-- eslint-disable vue/no-v-html -->
      <div v-if="isDev" style="max-inline-size: 80dvw; overflow-x: scroll;" v-html="error.stack" />
      <!-- eslint-enable -->

      <VBtn class="mb-6" @click="handleError">
        Back to Home
      </VBtn>
    </div>
  </NuxtLayout>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
