<script setup>
import {useRoute} from 'vue-router';
import Layout from './shared/presentation/components/layout.vue';
const route = useRoute();
</script>
<template>
  <router-view v-if="route.meta.public" />
  <Layout v-else />
</template>
