<script setup>
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const unavailableRoute = route.path;
const { t } = useI18n();
</script>

<template>
  <section>
    <h1>Page not found</h1>
  </section>

  <section>
    <p>
      The path "{{unavailableRoute}}" does not exist
    </p>

    <router-link to="/home">
      Return to home
    </router-link>
  </section>

</template>

<style scoped>

</style>