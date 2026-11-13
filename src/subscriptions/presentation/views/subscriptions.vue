<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useSubscriptionsStore} from '../../application/subscriptions.store.js';
import {isActiveSubscription} from '../../domain/model/subscription-plan.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
const store = useSubscriptionsStore();
const {t, n, d, locale} = useI18n();
const route = useRoute();
const router = useRouter();
const busy = ref(false);
const error = ref('');
const success = ref('');

async function run(action, successKey = '') {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await action();
    success.value = successKey;
    return result;
  } catch (failure) {
    error.value = /^(account|workspace|billing)\.[a-zA-Z]+$/.test(failure.message)
      ? failure.message
      : 'workspace.requestError';
  } finally {
    busy.value = false;
  }
}

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
function paymentTimestamp(payment) {
  const timestamp = Date.parse(payment.createdAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function paymentDate(payment) {
  const timestamp = paymentTimestamp(payment);

  if (timestamp === null) return t('billing.unavailable');

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function paymentPlan(payment) {
  const subscription = store.subscriptions.find(
      item => payment.subscriptionId != null &&
          String(item.id) === String(payment.subscriptionId),
  );

  return subscription?.planName || t('billing.unavailable');
}

const paymentHistory = computed(() =>
    [...store.payments].sort(
        (first, second) =>
            (paymentTimestamp(second) ?? -Infinity) -
            (paymentTimestamp(first) ?? -Infinity),
    ),
);
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

          <dl class="payment-details">
            <div>
              <dt>{{ t('billing.amount') }}</dt>
              <dd class="payment-amount">
                {{ n(result.amount, {
                style: 'currency',
                currency: result.currency,
              }) }}
              </dd>
            </div>

            <div>
              <dt>{{ t('billing.transactionDate') }}</dt>
              <dd>{{ paymentDate(result) }}</dd>
            </div>

            <div>
              <dt>{{ t('billing.plan') }}</dt>
              <dd>{{ paymentPlan(result) }}</dd>
            </div>

            <div>
              <dt>{{ t('billing.reference') }}</dt>
              <dd>{{ result.id }}</dd>
            </div>

            <div>
              <dt>{{ t('billing.subscriptionReference') }}</dt>
              <dd>{{ result.subscriptionId ?? t('billing.unavailable') }}</dd>
            </div>
          </dl>

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
        <div v-if="store.plans.length" class="plot-grid">
          <article
              v-for="plan in store.plans"
              :key="plan.id"
              class="account-card subscription-plan-card"
          >
            <h3>{{ plan.name }}</h3>

            <div>
              <p class="subscription-plan-price">
                {{ n(plan.price, {
                style: 'currency',
                currency: plan.currency,
              }) }}
              </p>
              <span>{{ t('billing.monthlyPrice') }}</span>
            </div>

            <ul class="subscription-plan-features">
              <li v-for="feature in plan.features" :key="feature">
                {{ feature }}
              </li>
            </ul>

            <router-link
                v-if="!active"
                class="action-link"
                :to="`/subscriptions/checkout/${plan.id}`"
            >
              <span>{{ t('billing.choose') }}</span>
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </router-link>
          </article>
        </div>
        <p v-else class="empty-state">{{ t('billing.noPlans') }}</p>
        <h2>{{ t('billing.history') }}</h2>
        <ul v-if="paymentHistory.length" class="activity-list payment-history"><li v-for="payment in paymentHistory" :key="payment.id"><div class="payment-history-information"><div class="payment-history-heading"><h3>{{ paymentPlan(payment) }}</h3><span class="payment-status">{{ t(`billing.${payment.status}`) }}</span></div><p><strong>{{ t('billing.reference') }}:</strong>{{ payment.id }}</p><p><i class="pi pi-calendar" aria-hidden="true"></i>{{ paymentDate(payment) }}</p></div><div class="payment-history-actions"><strong class="payment-amount">{{ n(payment.amount, {style: 'currency', currency: payment.currency,}) }}</strong><router-link class="action-link" :to="`/subscriptions/payments/${payment.id}`" :aria-label="`${t('billing.viewTransaction')}: ${payment.id}`"><span>{{ t('billing.viewTransaction') }}</span><i class="pi pi-arrow-right" aria-hidden="true"></i></router-link></div></li></ul>
        <p v-else>{{ t('billing.noPayments') }}</p>
      </template>
      <router-link
          v-if="checkout || resultPage"
          class="action-link"
          to="/subscriptions"
      >
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        <span>{{ t('navigation.subscriptions') }}</span>
      </router-link>
    </template>
  </section>
</template>
