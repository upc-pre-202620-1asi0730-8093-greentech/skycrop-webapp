import {CollectionApi} from '../../shared/infrastructure/collection-api.js';

/** HTTP operations for subscription plans, subscriptions and payments. */
export class SubscriptionsApi {
    #api = new CollectionApi();

    async getPlans() {
        return this.#api.list('subscriptionPlans');
    }

    async getSubscriptionsByUserId(userId) {
        const resources = await this.#api.list('subscriptions', {userId});

        return resources.filter(
            subscription => String(subscription.userId) === String(userId),
        );
    }

    async getPaymentsByUserId(userId) {
        const resources = await this.#api.list('payments', {userId});

        return resources.filter(
            payment => String(payment.userId) === String(userId),
        );
    }

    async createSubscription(resource) {
        return this.#api.create('subscriptions', resource);
    }

    async createPayment(resource) {
        return this.#api.create('payments', resource);
    }

    async updateSubscription(subscriptionId, changes) {
        return this.#api.patch('subscriptions', subscriptionId, changes);
    }
}