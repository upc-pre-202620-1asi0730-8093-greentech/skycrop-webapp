<script setup>
import {useI18n} from 'vue-i18n';
defineProps({busy: Boolean, error: String, success: String});
const {t} = useI18n();
</script>
<template>
  <p v-if="busy" role="status">{{ t('workspace.loading') }}</p>
  <p v-if="error" class="error-message" role="alert">{{ t(error) }}</p>
  <p v-if="success" class="success-message" role="status">{{ t(success) }}</p>
</template>
