<script setup>
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";

const { t, locale } = useI18n();

const prefix = computed(() => locale.value === 'de' ? '' : '/en');

const router = useRouter();
const getOppositeLocaleLink = computed(() => {
  const currentPrefix = locale.value === 'de' ? '/en' : '';
  const stripPrefix = locale.value === 'de' ? '' : '/' + locale.value;
  if (router.currentRoute.value.path.startsWith(stripPrefix)) {
    return currentPrefix + router.currentRoute.value.path.substring(stripPrefix.length);
  } else {
    return currentPrefix + router.currentRoute.value.path;
  }
});
</script>

<template>

  <VerticalNavLink :item="{
    icon: 'bx-home',
    title: t('nav.overview'),
    to: `${prefix}/tools`,
  }" />

  <VerticalNavLink :item="{
    icon: 'bx-question-mark',
    title: t('nav.about'),
    to: `${prefix}/about`,
  }" />

  <VerticalNavGroup v-for="(category_name, index) in get_tools_categories(locale.value)" :key="index" :item="{
    title: category_name,
    icon: 'bx-align-middle',
  }">
    <VerticalNavLink v-for="(tool, index2) in get_tools_by_category(category_name, locale.value)" :index="index2" :item="{
      title: tool.name,
      to: `${prefix}${tool.link}`,
    }" />
  </VerticalNavGroup>



  <VerticalNavLink :item="{
    icon: 'bx-globe',
    title: t('nav.locales.switch'),
    to: getOppositeLocaleLink,
  }" class="nav-link-locale" />
</template>

<style scoped>
.nav-link-locale {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>
