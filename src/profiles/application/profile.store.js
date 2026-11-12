import {defineStore} from 'pinia';
import {ref} from 'vue';
import {ProfilesApi} from '../infrastructure/profiles-api.js';
import {ProfileAssembler} from '../infrastructure/profile.assembler.js';
import {useSessionStore} from '../../iam/application/session.store.js';
import {ProfileDetails} from '../domain/model/profile-details.js';

const profilesApi = new ProfilesApi();

/** Coordinates profile and preferences state for the active mock identity. */
export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null);

  async function load() {
    const userId = useSessionStore().user.id;

    profile.value = null;

    const resource = await profilesApi.getProfileByUserId(userId);
    profile.value = ProfileAssembler.toModelFromResource(resource);
  }

  async function save(fields) {
    const userId = useSessionStore().user.id;
    const details = new ProfileDetails(fields);
    const resource = ProfileAssembler.toResourceFromDetails(
        userId,
        details,
    );

    const savedResource = profile.value?.id != null
        ? await profilesApi.updateProfile(profile.value.id, resource)
        : await profilesApi.createProfile(resource);

    profile.value = ProfileAssembler.toModelFromResource(savedResource);
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