import {defineStore} from 'pinia';
import {ref} from 'vue';
import {CollectionApi} from '../../shared/infrastructure/collection-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';
const api = new CollectionApi();

/** Profile and preferences resources belong to the active mock identity. */
export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null);
  async function load() {
    const userId = useSessionStore().user.id;
    profile.value = null;
    profile.value = (await api.list('userProfiles', {userId})).find(item => String(item.userId) === String(userId)) ?? null;
  }
  async function save(fields) {
    const userId = useSessionStore().user.id;
    const allowed = {userId, phone: fields.phone?.trim() ?? '', occupation: fields.occupation?.trim() ?? '', language: fields.language ?? 'en', emailNotifications: Boolean(fields.emailNotifications)};
    if (profile.value?.id != null) profile.value = await api.patch('userProfiles', profile.value.id, allowed);
    else profile.value = await api.create('userProfiles', allowed);
  }
  async function setTwoFactor(enabled) {
    await api.patch('users', useSessionStore().user.id, {twoFactorEnabled: Boolean(enabled)});
  }
  async function getTwoFactor() {
    const id = useSessionStore().user.id;
    return Boolean((await api.list('users', {id})).find(item => String(item.id) === String(id))?.twoFactorEnabled);
  }
  return {profile, load, save, setTwoFactor, getTwoFactor};
});
