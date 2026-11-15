import {defineStore} from 'pinia';
import {ref} from 'vue';
import {CollectionApi} from '../../shared/infrastructure/collection-api.js';
import {useSessionStore} from '../../iam/application/session.store.js';
import {EmailAddress} from '../../iam/domain/model/email-address.js';
import {canManagePlotMembers} from '../domain/model/plot-membership-policy.js';
const api = new CollectionApi();

/** Plot collaboration resources. Invitations are recorded; the mock sends no email. */
export const usePlotMembersStore = defineStore('plot-members', () => {
  const plots = ref([]), members = ref([]), invitations = ref([]);
  async function load() {
    const userId = useSessionStore().user.id;
    const [allPlots, allMembers, allInvitations] = await Promise.all([api.list('plots'), api.list('plotUsers'), api.list('plotInvitations')]);
    // Legacy plots without owner IDs remain visible in the shared demonstration workspace.
    const visible = plot => plot.ownerId == null || String(plot.ownerId) === String(userId)
      || allMembers.some(member => String(member.plotId) === String(plot.id) && String(member.userId) === String(userId));
    plots.value = allPlots.filter(visible);
    members.value = allMembers.filter(member => plots.value.some(plot => String(plot.id) === String(member.plotId)));
    invitations.value = allInvitations.filter(item => String(item.invitedBy) === String(userId));
  }
  function canInvite(plotId) {
    return canManagePlotMembers(plots.value.find(plot => String(plot.id) === String(plotId)), members.value, useSessionStore().user?.id);
  }
  async function invite({plotId, email, role}) {
    const session = useSessionStore();
    if (!canInvite(plotId)) throw new Error('workspace.invitationForbidden');
    email = new EmailAddress(email).value;
    if (!plots.value.some(plot => String(plot.id) === String(plotId)) || !['COLLABORATOR', 'VIEWER'].includes(role)) throw new Error('workspace.invalidInvitation');
    if (email === session.user.email) throw new Error('workspace.selfInvitation');
    if (invitations.value.some(item => String(item.plotId) === String(plotId) && item.email === email && item.status === 'PENDING')) throw new Error('workspace.duplicateInvitation');
    const created = await api.create('plotInvitations', {plotId, email, role, invitedBy: session.user.id, status: 'PENDING', createdAt: new Date().toISOString(), simulated: true});
    invitations.value.push(created);
  }
  async function revoke(id) {
    if (!invitations.value.some(item => String(item.id) === String(id) && item.status === 'PENDING')) return;
    const updated = await api.patch('plotInvitations', id, {status: 'CANCELLED'});
    invitations.value = invitations.value.map(item => String(item.id) === String(id) ? updated : item);
  }
  return {plots, members, invitations, canInvite, load, invite, revoke};
});
