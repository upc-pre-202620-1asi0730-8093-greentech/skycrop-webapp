<script setup>
import {onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useProfileStore} from '../../application/profile.store.js';
import {useSessionStore} from '../../../iam/application/session.store.js';
import {useRequest} from '../../../shared/presentation/composables/use-request.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
const session = useSessionStore(), store = useProfileStore(), {t} = useI18n();
const {busy, error, success, run} = useRequest();
const ready = ref(false), form = reactive({name: '', phone: '', occupation: ''});
async function load() {
  await run(async () => { await store.load(); Object.assign(form, store.profile ?? {}, {name: session.user.name}); ready.value = true; });
}
onMounted(load);
async function save() {
  await run(async () => {
    if (!form.name.trim()) throw new Error('account.invalidRegistration');
    await store.save({...store.profile, ...form});
    await session.updateName(form.name);
  }, 'workspace.saved');
}
</script>
<template>
  <section class="plots-page account-page">
    <h1>{{ t('navigation.profile') }}</h1>
    <request-status :busy="busy" :error="error" :success="success" />
    <pv-button v-if="error && !ready" :label="t('workspace.retry')" @click="load" :disabled="busy" />
    <form v-if="ready" class="account-card profile-card" @submit.prevent="save" :aria-busy="busy">
      <h2>{{ t('account.personalInformation') }}</h2>
      <div class="form-field"><label for="profile-name">{{ t('account.name') }}</label><pv-input-text id="profile-name" v-model="form.name" autocomplete="name" maxlength="120" required /></div>
      <div class="form-field"><label for="profile-email">{{ t('account.email') }}</label><pv-input-text id="profile-email" :model-value="session.user?.email" readonly /><small>{{ t('account.emailHelp') }}</small></div>
      <div class="form-field"><label for="phone">{{ t('account.phone') }}</label><pv-input-text id="phone" v-model="form.phone" type="tel" autocomplete="tel" maxlength="30" /></div>
      <div class="form-field"><label for="occupation">{{ t('account.occupation') }}</label><pv-input-text id="occupation" v-model="form.occupation" maxlength="120" /></div>
      <div class="form-actions"><pv-button type="submit" :label="t('workspace.save')" :disabled="busy" /></div>
    </form>
    <router-link class="section-link" to="/subscriptions">{{ t('navigation.subscriptions') }}</router-link>
  </section>
</template>
