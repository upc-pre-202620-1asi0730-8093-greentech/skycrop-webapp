import {defineStore} from 'pinia';
import {ref} from 'vue';
import {CollectionApi} from '../../shared/infrastructure/collection-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';
const api = new CollectionApi();

/** User-scoped notification inbox. Mock resources do not deliver push or email. */
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([]);
  async function load() {
    const userId = useSessionStore().user.id;
    notifications.value = (await api.list('notifications', {userId}))
      .filter(item => String(item.userId) === String(userId))
      .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }
  async function markRead(id) {
    if (!notifications.value.some(item => String(item.id) === String(id))) return;
    const updated = await api.patch('notifications', id, {read: true, readAt: new Date().toISOString()});
    notifications.value = notifications.value.map(item => String(item.id) === String(id) ? updated : item);
  }
  return {notifications, load, markRead};
});
