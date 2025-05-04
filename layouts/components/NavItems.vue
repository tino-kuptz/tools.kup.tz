<script setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";
</script>

<template>

  <VerticalNavLink :item="{
    icon: 'bx-home',
    title: 'Übersicht',
    to: '/tools',
  }" />

  <VerticalNavLink :item="{
    icon: 'bx-question-mark',
    title: 'Über',
    to: '/about',
  }" />

  <VerticalNavGroup v-for="(category_name, index) in get_tools_categories()" :key="index" :item="{
    title: category_name,
    icon: 'bx-align-middle',
  }">
    <VerticalNavLink v-for="(tool, index2) in get_tools_by_category(category_name)" :index="index2" :item="{
      title: tool.name,
      to: tool.link,
    }" />
  </VerticalNavGroup>
</template>
