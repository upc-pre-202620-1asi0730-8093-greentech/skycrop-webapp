<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {useRoute} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {usePlotMembersStore} from '../../application/plot-members.store.js';
import {useRequest} from '../../../shared/presentation/composables/use-request.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
const store = usePlotMembersStore(), route = useRoute(), {t} = useI18n();
const {busy, error, success, run} = useRequest();
const loaded = ref(false), form = reactive({plotId: route.params.id ?? null, email: '', role: 'COLLABORATOR'});
const members = computed(() => store.members.filter(item => String(item.plotId) === String(form.plotId)));
const invitations = computed(() => store.invitations.filter(item => String(item.plotId) === String(form.plotId)));
async function load() {
  await run(async () => {
    await store.load();
    const plot = store.plots.find(item => String(item.id) === String(form.plotId)) ?? (!route.params.id ? store.plots[0] : null);
    form.plotId = plot?.id ?? null; loaded.value = true;
  });
}
onMounted(load);
async function invite() { await run(async () => { await store.invite(form); form.email = ''; }, 'workspace.invitationSaved'); }
</script>
<template>
  <section class="plots-page account-page">
    <h1>{{ t('workspace.members') }}</h1>
    <request-status :busy="busy" :error="error" :success="success" />
    <pv-button v-if="error" :label="t('workspace.retry')" @click="load" :disabled="busy" />
    <template v-if="loaded">
      <form v-if="form.plotId != null && store.canInvite(form.plotId)" class="account-card profile-card" @submit.prevent="invite">
        <h2>{{ t('workspace.invite') }}</h2>
        <div class="form-field"><label for="invitation-plot">{{ t('plots.name') }}</label><pv-select input-id="invitation-plot" v-model="form.plotId" :options="store.plots" option-label="name" option-value="id" /></div>
        <div class="form-field"><label for="invitation-email">{{ t('account.email') }}</label><pv-input-text id="invitation-email" v-model="form.email" type="email" maxlength="254" required /></div>
        <div class="form-field"><label for="invitation-role">{{ t('workspace.role') }}</label><pv-select input-id="invitation-role" v-model="form.role" :options="['COLLABORATOR', 'VIEWER'].map(value => ({value, label: t(`workspace.${value}`)}))" option-label="label" option-value="value" /></div>
        <pv-button type="submit" :label="t('workspace.invite')" :disabled="busy" />
      </form>
      <div v-else-if="form.plotId != null" class="empty-state"><p>{{ t('workspace.invitationForbidden') }}</p><label for="readonly-plot">{{ t('plots.name') }}</label><pv-select input-id="readonly-plot" v-model="form.plotId" :options="store.plots" option-label="name" option-value="id" /></div><p v-else class="empty-state">{{ t('workspace.noPlot') }}</p>
      <template v-if="form.plotId != null">
        <h2>{{ t('workspace.members') }}</h2>
        <ul v-if="members.length" class="activity-list"><li v-for="member in members" :key="member.id">{{ member.name || member.email || member.userId }} · {{ member.role }}</li></ul><p v-else>{{ t('workspace.noMembers') }}</p>
        <h2>{{ t('workspace.invitations') }}</h2>
        <ul v-if="invitations.length" class="activity-list"><li v-for="invitation in invitations" :key="invitation.id"><span>{{ invitation.email }} · {{ t(`workspace.${invitation.status}`) }}</span><pv-button v-if="invitation.status === 'PENDING'" :label="t('workspace.revoke')" @click="run(() => store.revoke(invitation.id))" :disabled="busy" /></li></ul><p v-else>{{ t('workspace.noInvitations') }}</p>
      </template>
    </template>
  </section>
</template>
