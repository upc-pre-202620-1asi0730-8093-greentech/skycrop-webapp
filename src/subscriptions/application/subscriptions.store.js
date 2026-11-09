import {defineStore} from 'pinia';
import {ref} from 'vue';
import {CollectionApi} from '../../shared/infrastructure/collection-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';
import {SubscriptionPlan, renewalDate, isActiveSubscription} from '../domain/model/subscription-plan.js';
const api = new CollectionApi();

/** Mock subscription workflow. Payment resources never contain bank card data. */
export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const plans = ref([]), subscriptions = ref([]), payments = ref([]);
  async function load() {
    const userId = useSessionStore().user.id;
    const [catalogue, records, transactions] = await Promise.all([
      api.list('subscriptionPlans'), api.list('subscriptions', {userId}), api.list('payments', {userId})
    ]);
    plans.value = catalogue.map(item => new SubscriptionPlan(item));
    subscriptions.value = records.filter(item => String(item.userId) === String(userId));
    payments.value = transactions.filter(item => String(item.userId) === String(userId));
  }
  async function purchase(planId, outcome) {
    const plan = plans.value.find(item => String(item.id) === String(planId));
    if (!plan || !['APPROVED', 'DECLINED', 'PENDING'].includes(outcome)) throw new Error('billing.invalidPlan');
    if (subscriptions.value.some(item => isActiveSubscription(item))) throw new Error('billing.alreadyActive');
    const userId = useSessionStore().user.id, now = new Date().toISOString();
    // Persist the subscription first as pending so a failed payment write cannot activate it.
    const subscription = await api.create('subscriptions', {userId, planId: plan.id, planName: plan.name, status: 'PENDING', startedAt: now, expiresAt: renewalDate(now), simulated: true});
    subscriptions.value.push(subscription);
    const payment = await api.create('payments', {userId, subscriptionId: subscription.id, planId: plan.id, amount: plan.price, currency: plan.currency, status: outcome, createdAt: now, simulated: true});
    payments.value.push(payment);
    if (outcome !== 'PENDING') {
      const updated = await api.patch('subscriptions', subscription.id, {status: outcome === 'APPROVED' ? 'ACTIVE' : 'CANCELLED'});
      subscriptions.value = subscriptions.value.map(item => item.id === updated.id ? updated : item);
    }
    return payment;
  }
  async function cancel(id) {
    const subscription = subscriptions.value.find(item => String(item.id) === String(id));
    if (!isActiveSubscription(subscription)) throw new Error('billing.noActive');
    const updated = await api.patch('subscriptions', id, {status: 'CANCELLED', cancelledAt: new Date().toISOString()});
    subscriptions.value = subscriptions.value.map(item => String(item.id) === String(id) ? updated : item);
  }
  return {plans, subscriptions, payments, load, purchase, cancel};
});
