import {defineStore} from 'pinia';
import {ref, watch} from 'vue';
import {ProfilesApi} from '../infrastructure/profiles-api.js';
import {ProfileAssembler} from '../infrastructure/profile.assembler.js';
import {useSessionStore} from '../../iam/application/session.store.js';
import {ProfileDetails} from '../domain/model/profile-details.js';

const profilesApi = new ProfilesApi();

/** Coordinates profile state and rejects results from obsolete operations. */
export const useProfileStore = defineStore('profile', () => {
  const session = useSessionStore();
  const profile = ref(null);

  let profileRevision = 0;
  let sessionRevision = 0;

  watch(
      () => session.user?.id,
      () => {
        sessionRevision++;
        profileRevision++;
        profile.value = null;
      },
      {flush: 'sync'},
  );

  function requireUserId() {
    if (!session.isSignedIn() || session.user?.id == null) {
      throw new Error('workspace.requestError');
    }

    return session.user.id;
  }

  function assertCurrentSession(revision) {
    requireUserId();

    if (revision !== sessionRevision) {
      throw new Error('workspace.requestError');
    }
  }

  function assertCurrentProfile(revision, identityRevision) {
    assertCurrentSession(identityRevision);

    if (revision !== profileRevision) {
      throw new Error('workspace.requestError');
    }
  }

  async function load() {
    const userId = requireUserId();
    const identityRevision = sessionRevision;
    const revision = ++profileRevision;

    profile.value = null;

    const resource = await profilesApi.getProfileByUserId(userId);

    assertCurrentProfile(revision, identityRevision);
    profile.value = ProfileAssembler.toModelFromResource(resource);
  }

  async function save(fields) {
    const userId = requireUserId();
    const details = new ProfileDetails(fields);
    const resource = ProfileAssembler.toResourceFromDetails(
        userId,
        details,
    );

    const profileId = profile.value?.id;
    const identityRevision = sessionRevision;
    const revision = ++profileRevision;

    const savedResource = profileId != null
        ? await profilesApi.updateProfile(profileId, resource)
        : await profilesApi.createProfile(resource);

    assertCurrentProfile(revision, identityRevision);
    profile.value = ProfileAssembler.toModelFromResource(savedResource);
  }

  async function setTwoFactor(enabled) {
    const userId = requireUserId();
    const identityRevision = sessionRevision;

    await profilesApi.updateTwoFactorEnabled(userId, enabled);

    assertCurrentSession(identityRevision);
  }

  async function getTwoFactor() {
    const userId = requireUserId();
    const identityRevision = sessionRevision;

    const enabled = await profilesApi.getTwoFactorEnabled(userId);

    assertCurrentSession(identityRevision);
    return enabled;
  }

  return {profile, load, save, setTwoFactor, getTwoFactor};
});