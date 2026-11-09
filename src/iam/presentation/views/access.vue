<script setup>
import {computed, reactive, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useSessionStore} from '../../application/session.store.js';
import {safeReturnPath} from '../../domain/model/navigation-policy.js';
import {useRequest} from '../../../shared/presentation/composables/use-request.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';
import logo from '../../../assets/skycrop-logo.png';
const route = useRoute(), router = useRouter(), session = useSessionStore(), {t} = useI18n();
const {busy, error, success, run} = useRequest();
const form = reactive({name: '', email: '', password: '', confirmPassword: '', acceptedTerms: false, code: ''});
const mode = computed(() => route.name);
watch(mode, () => { error.value = ''; success.value = ''; form.password = ''; form.confirmPassword = ''; form.code = ''; });
async function submit() {
  await run(async () => {
    if (mode.value === 'register') {
      if (form.password !== form.confirmPassword) throw new Error('account.passwordMismatch');
      await session.register(form); await router.replace('/home');
    } else if (mode.value === 'login') {
      const signedIn = await session.login(form);
      await router.replace(signedIn ? safeReturnPath(route.query.redirect) : {name: 'verify-access', query: {redirect: safeReturnPath(route.query.redirect)}});
    } else if (mode.value === 'recover-access') {
      await session.requestRecovery(form.email); await router.push('/verify-access');
    } else {
      const recovery = session.challenge?.kind === 'recovery';
      if (recovery && form.password !== form.confirmPassword) throw new Error('account.passwordMismatch');
      await session.verifyChallenge(form.code, form.password);
      await router.replace(recovery ? {name: 'login', query: {reset: '1'}} : safeReturnPath(route.query.redirect));
    }
  });
  form.password = ''; form.confirmPassword = '';
}
</script>
<template>
  <div class="public-layout">
    <header class="public-language"><language-switcher /></header>
    <main class="access-page">
      <img :src="logo" alt="SkyCrop" class="access-logo">
      <h1>{{ t('account.welcome') }}</h1>
      <p class="prototype-notice">{{ t('account.demoNotice') }}</p>
      <form class="account-card access-card" @submit.prevent="submit" :aria-busy="busy">
        <h2>{{ t(`account.${mode}Title`) }}</h2>
        <request-status :busy="busy" :error="error" :success="success" />
        <p v-if="route.query.reset === '1'" role="status">{{ t('account.passwordReset') }}</p>
        <template v-if="mode === 'verify-access'">
          <template v-if="session.challenge">
            <p>{{ t('account.demoCode', {code: session.challenge.code}) }}</p>
            <p>{{ t('account.codeHelp') }}</p>
            <div class="form-field"><label for="code">{{ t('account.code') }}</label><pv-input-text id="code" v-model="form.code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required /></div>
          </template>
          <p v-else>{{ t('account.noChallenge') }}</p>
        </template>
        <template v-else>
          <div v-if="mode === 'register'" class="form-field"><label for="full-name">{{ t('account.name') }}</label><pv-input-text id="full-name" v-model="form.name" autocomplete="name" maxlength="120" required /></div>
          <div class="form-field"><label for="email">{{ t('account.email') }}</label><pv-input-text id="email" v-model="form.email" type="email" autocomplete="email" maxlength="254" required /></div>
        </template>
        <template v-if="['login', 'register'].includes(mode) || (mode === 'verify-access' && session.challenge?.kind === 'recovery')">
          <div class="form-field"><label for="password">{{ t('account.password') }}</label><pv-input-text id="password" v-model="form.password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" :minlength="mode === 'login' ? 1 : 8" maxlength="128" required /></div>
          <div v-if="mode !== 'login'" class="form-field"><label for="confirm-password">{{ t('account.confirmPassword') }}</label><pv-input-text id="confirm-password" v-model="form.confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required /></div>
        </template>
        <label v-if="mode === 'register'" class="check-field"><input v-model="form.acceptedTerms" type="checkbox" required>{{ t('account.acceptDemo') }}</label>
        <pv-button v-if="mode !== 'verify-access' || session.challenge" type="submit" :label="t(`account.${mode}Action`)" :disabled="busy" class="access-submit" />
        <div class="access-links">
          <router-link v-if="mode !== 'login'" to="/login">{{ t('account.loginAction') }}</router-link>
          <router-link v-if="mode === 'login'" to="/register">{{ t('account.registerTitle') }}</router-link>
          <router-link v-if="mode === 'login' || mode === 'verify-access'" to="/recover-access">{{ t('account.recover-accessTitle') }}</router-link>
        </div>
      </form>
    </main>
    <footer class="app-footer">© {{ new Date().getFullYear() }} GreenTech · SkyCrop</footer>
  </div>
</template>
