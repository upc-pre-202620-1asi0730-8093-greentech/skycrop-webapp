import {defineStore} from 'pinia';
import {ref} from 'vue';
import {SubscriptionsApi} from '../infrastructure/subscriptions-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';
import {
  SubscriptionPlan,
  renewalDate,
  isActiveSubscription,
} from '../domain/model/subscription-plan.js';

const subscriptionsApi = new SubscriptionsApi();

/** Coordinates mock subscriptions and payments without collecting card data. */
export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const plans = ref([]);
  const subscriptions = ref([]);
  const payments = ref([]);

  async function load() {
    const userId = useSessionStore().user.id;

    const [catalogue, records, transactions] = await Promise.all([
      subscriptionsApi.getPlans(),
      subscriptionsApi.getSubscriptionsByUserId(userId),
      subscriptionsApi.getPaymentsByUserId(userId),
    ]);

    plans.value = catalogue.map(item => new SubscriptionPlan(item));
    subscriptions.value = records;
    payments.value = transactions;
  }

  async function purchase(planId, outcome) {
    const plan = plans.value.find(
        item => String(item.id) === String(planId),
    );

    if (!plan || !['APPROVED', 'DECLINED', 'PENDING'].includes(outcome)) {
      throw new Error('billing.invalidPlan');
    }

    if (subscriptions.value.some(item => isActiveSubscription(item))) {
      throw new Error('billing.alreadyActive');
    }

    const userId = useSessionStore().user.id;
    const now = new Date().toISOString();

    // Keep the subscription pending until the payment is recorded.
    const subscription = await subscriptionsApi.createSubscription({
      userId,
      planId: plan.id,
      planName: plan.name,
      status: 'PENDING',
      startedAt: now,
      expiresAt: renewalDate(now),
      simulated: true,
    });

    subscriptions.value.push(subscription);

    const payment = await subscriptionsApi.createPayment({
      userId,
      subscriptionId: subscription.id,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      status: outcome,
      createdAt: now,
      simulated: true,
    });

    payments.value.push(payment);

    if (outcome !== 'PENDING') {
      const updated = await subscriptionsApi.updateSubscription(
          subscription.id,
          {
            status: outcome === 'APPROVED' ? 'ACTIVE' : 'CANCELLED',
          },
      );

      subscriptions.value = subscriptions.value.map(
          item => item.id === updated.id ? updated : item,
      );
    }

    return payment;
  }

  async function cancel(id) {
    const subscription = subscriptions.value.find(
        item => String(item.id) === String(id),
    );

    if (!isActiveSubscription(subscription)) {
      throw new Error('billing.noActive');
    }

    const updated = await subscriptionsApi.updateSubscription(id, {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    });

    subscriptions.value = subscriptions.value.map(
        item => String(item.id) === String(id) ? updated : item,
    );
  }

  return {plans, subscriptions, payments, load, purchase, cancel};
});