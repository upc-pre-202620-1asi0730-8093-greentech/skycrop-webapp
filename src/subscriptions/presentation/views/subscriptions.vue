<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useSubscriptionsStore} from '../../application/subscriptions.store.js';
import {isActiveSubscription} from '../../domain/model/subscription-plan.js';
import {useRequest} from '../../../shared/presentation/composables/use-request.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
const store = useSubscriptionsStore(), {t, n, d} = useI18n(), route = useRoute(), router = useRouter();
const {busy, error, success, run} = useRequest();
const loaded = ref(false), confirmed = ref(false), outcome = ref('APPROVED'), cancelId = ref(null);
const selected = computed(() => store.plans.find(plan => String(plan.id) === String(route.params.planId)));
const active = computed(() => store.subscriptions.find(item => isActiveSubscription(item)));
const result = computed(() => store.payments.find(item => String(item.id) === String(route.params.paymentId)));
const checkout = computed(() => route.name === 'subscription-checkout');
const resultPage = computed(() => route.name === 'payment-result');
async function load() { await run(async () => { await store.load(); loaded.value = true; }); }
onMounted(load);
async function pay() {
  if (!confirmed.value) return;
  await run(async () => { const payment = await store.purchase(selected.value.id, outcome.value); await router.push(`/subscriptions/payments/${payment.id}`); });
}
async function cancel() { await run(async () => { await store.cancel(cancelId.value); cancelId.value = null; }, 'billing.cancelled'); }
</script>
<template>
  <section class="plots-page account-page">
    <h1>{{ t(checkout ? 'billing.acquire' : resultPage ? 'billing.paymentResult' : 'navigation.subscriptions') }}</h1>
    <request-status :busy="busy" :error="error" :success="success" />
    <pv-button v-if="error" :label="t('workspace.retry')" @click="load" :disabled="busy" />
    <template v-if="loaded">
      <template v-if="resultPage">
        <article v-if="result" class="account-card profile-card">
          <h2>{{ t(`billing.${result.status}`) }}</h2>
          <p>{{ t('billing.reference') }}: {{ result.id }}</p>
          <p>{{ n(result.amount, {style: 'currency', currency: result.currency}) }}</p>
          <p>{{ t('billing.paymentRecordHint') }}</p>
        </article>
        <p v-else class="empty-state">{{ t('billing.paymentNotFound') }}</p>
      </template>
      <template v-else-if="checkout">
        <div v-if="selected && !active" class="billing-grid">
          <article class="account-card"><h2>{{ t('billing.details') }}</h2><h3>{{ selected.name }}</h3><ul><li v-for="feature in selected.features" :key="feature">{{ feature }}</li></ul><p>{{ t('billing.monthlyPrice') }}: {{ n(selected.price, {style: 'currency', currency: selected.currency}) }}</p></article>
          <form class="account-card" @submit.prevent="pay">
            <h2>{{ t('billing.payment') }}</h2>
            <div class="form-field"><label for="payment-outcome">{{ t('billing.paymentStatus') }}</label><pv-select input-id="payment-outcome" v-model="outcome" :options="['APPROVED', 'DECLINED', 'PENDING'].map(value => ({value, label: t(`billing.${value}`)}))" option-label="label" option-value="value" /></div>
            <label class="check-field"><input v-model="confirmed" type="checkbox" required>{{ t('billing.confirmPayment') }}</label>
            <pv-button type="submit" :label="t('billing.pay')" :disabled="busy || !confirmed" />
          </form>
        </div>
        <p v-else class="empty-state">{{ t(active ? 'billing.alreadyActive' : 'billing.planNotFound') }}</p>
      </template>
      <template v-else>
        <article v-if="active" class="account-card profile-card"><h2>{{ t('billing.current') }}</h2><p>{{ active.planName }}</p><p>{{ t('billing.expires') }}: {{ d(new Date(active.expiresAt)) }}</p><pv-button :label="t('billing.cancel')" @click="cancelId = active.id" :disabled="busy" /></article>
        <p v-else>{{ t('billing.noActive') }}</p>
        <div v-if="cancelId != null" class="empty-state" role="group" :aria-label="t('billing.cancel')"><p>{{ t('billing.cancelConfirm') }}</p><div class="form-actions"><pv-button :label="t('workspace.keep')" @click="cancelId = null" :disabled="busy" /><pv-button :label="t('billing.cancel')" @click="cancel" :disabled="busy" /></div></div>
        <h2>{{ t('billing.plans') }}</h2>
        <div v-if="store.plans.length" class="plot-grid"><article v-for="plan in store.plans" :key="plan.id" class="account-card"><h2>{{ plan.name }}</h2><p>{{ n(plan.price, {style: 'currency', currency: plan.currency}) }}</p><ul><li v-for="feature in plan.features" :key="feature">{{ feature }}</li></ul><router-link v-if="!active" class="action-link" :to="`/subscriptions/checkout/${plan.id}`">{{ t('billing.choose') }}</router-link></article></div>
        <p v-else class="empty-state">{{ t('billing.noPlans') }}</p>
        <h2>{{ t('billing.history') }}</h2>
        <ul v-if="store.payments.length" class="activity-list"><li v-for="payment in store.payments" :key="payment.id"><router-link :to="`/subscriptions/payments/${payment.id}`">{{ t(`billing.${payment.status}`) }} · {{ n(payment.amount, {style: 'currency', currency: payment.currency}) }}</router-link></li></ul>
        <p v-else>{{ t('billing.noPayments') }}</p>
      </template>
      <router-link v-if="checkout || resultPage" class="section-link" to="/subscriptions">{{ t('navigation.subscriptions') }}</router-link>
    </template>
  </section>
</template>
