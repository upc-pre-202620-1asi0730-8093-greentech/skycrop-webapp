import {defineStore} from 'pinia';
import {ref} from 'vue';
import {ProfilesApi} from '../infrastructure/profiles-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';
import {ProfileDetails} from '../domain/model/profile-details.js';

const profilesApi = new ProfilesApi();

/** Coordinates profile and preferences state for the active mock identity. */
export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null);

  async function load() {
    const userId = useSessionStore().user.id;

    profile.value = null;
    profile.value = await profilesApi.getProfileByUserId(userId);
  }

  async function save(fields) {
    const userId = useSessionStore().user.id;
    const details = new ProfileDetails(fields);

    const allowed = {
      userId,
      phone: details.phone,
      occupation: details.occupation,
      language: details.language,
      emailNotifications: details.emailNotifications,
    };

    if (profile.value?.id != null) {
      profile.value = await profilesApi.updateProfile(
          profile.value.id,
          allowed,
      );
    } else {
      profile.value = await profilesApi.createProfile(allowed);
    }
  }

  async function setTwoFactor(enabled) {
    const userId = useSessionStore().user.id;

    await profilesApi.updateTwoFactorEnabled(userId, enabled);
  }

  async function getTwoFactor() {
    const userId = useSessionStore().user.id;

    return profilesApi.getTwoFactorEnabled(userId);
  }

  return {profile, load, save, setTwoFactor, getTwoFactor};
});