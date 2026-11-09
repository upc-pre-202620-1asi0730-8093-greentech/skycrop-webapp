<script setup>
import {onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useProfileStore} from '../../application/profile.store.js';
import {useRequest} from '../../../shared/presentation/composables/use-request.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
const {t, locale} = useI18n(), store = useProfileStore();
const {busy, error, success, run} = useRequest();
const ready = ref(false), form = reactive({language: locale.value, emailNotifications: false, twoFactorEnabled: false});
async function load() {
  await run(async () => {
    await store.load();
    form.emailNotifications = store.profile?.emailNotifications ?? false;
    form.language = store.profile?.language ?? locale.value;
    form.twoFactorEnabled = await store.getTwoFactor(); ready.value = true;
  });
}
onMounted(load);
async function save() {
  await run(async () => {
    await store.save({...store.profile, ...form});
    await store.setTwoFactor(form.twoFactorEnabled);
    locale.value = form.language;
  }, 'workspace.saved');
}
</script>
<template>
  <section class="plots-page account-page">
    <h1>{{ t('navigation.settings') }}</h1>
    <request-status :busy="busy" :error="error" :success="success" />
    <pv-button v-if="!ready && error" :label="t('workspace.retry')" @click="load" :disabled="busy" />
    <form v-if="ready" class="account-card profile-card" @submit.prevent="save">
      <h2>{{ t('account.preferences') }}</h2>
      <div class="form-field"><label for="preferred-language">{{ t('language') }}</label><pv-select input-id="preferred-language" v-model="form.language" :options="[{label: 'English', value: 'en'}, {label: 'Español', value: 'es'}]" option-label="label" option-value="value" /></div>
      <label class="check-field"><input v-model="form.emailNotifications" type="checkbox">{{ t('account.emailNotifications') }}</label>
      <label class="check-field"><input v-model="form.twoFactorEnabled" type="checkbox">{{ t('account.twoFactor') }}</label>
      <p>{{ t('account.preferencesNotice') }}</p>
      <div class="form-actions"><pv-button type="submit" :label="t('workspace.save')" :disabled="busy" /></div>
    </form>
  </section>
</template>
