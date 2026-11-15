<script setup>
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const unavailableRoute = route.path;
const { t } = useI18n();
</script>

<template>
  <section class="page-heading">
    <h1>{{t('pageNotFound.title')}}</h1>
  </section>

  <section class="not-found-section">
    <p class="not-found-text">
      {{ t('pageNotFound.content', { 'unavailablePath': unavailableRoute }) }}
    </p>

    <router-link to="/home" class="action-link">
      {{t('pageNotFound.goHome')}}
    </router-link>
  </section>

</template>

<style scoped>

</style>