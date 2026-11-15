import {CollectionApi} from '../../shared/infrastructure/collection-api.js';

/** HTTP operations for the active user's notification inbox. */
export class NotificationsApi {
    #api = new CollectionApi();

    async getNotificationsByUserId(userId) {
        const resources = await this.#api.list('notifications', {userId});

        return resources.filter(
            notification => String(notification.userId) === String(userId),
        );
    }

    async markNotificationAsRead(notificationId, readAt) {
        return this.#api.patch('notifications', notificationId, {
            read: true,
            readAt,
        });
    }
}