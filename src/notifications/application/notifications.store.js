import {defineStore} from 'pinia';
import {ref} from 'vue';
import {NotificationsApi} from '../infrastructure/notifications-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';

const notificationsApi = new NotificationsApi();

/** Coordinates notification state, ordering and read actions. */
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([]);

  async function load() {
    const userId = useSessionStore().user.id;
    const resources = await notificationsApi.getNotificationsByUserId(userId);

    notifications.value = resources.sort(
        (first, second) =>
            (Date.parse(second.createdAt) || 0) -
            (Date.parse(first.createdAt) || 0),
    );
  }

  async function markRead(id) {
    const exists = notifications.value.some(
        notification => String(notification.id) === String(id),
    );

    if (!exists) return;

    const readAt = new Date().toISOString();
    const updated = await notificationsApi.markNotificationAsRead(id, readAt);

    notifications.value = notifications.value.map(
        notification =>
            String(notification.id) === String(id)
                ? updated
                : notification,
    );
  }

  return {notifications, load, markRead};
});