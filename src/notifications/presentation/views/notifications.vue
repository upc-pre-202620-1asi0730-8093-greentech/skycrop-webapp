<script setup>
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useNotificationsStore} from '../../application/notifications.store.js';
import {notificationLink} from '../../domain/model/notification-link.js';
import {useRequest} from '../../../shared/presentation/composables/use-request.js';
import RequestStatus from '../../../shared/presentation/components/request-status.vue';
const store = useNotificationsStore(), {t, d} = useI18n();
const {busy, error, success, run} = useRequest();
const filter = ref('all'), loaded = ref(false);
const filtered = computed(() => store.notifications.filter(item => filter.value === 'all' || !item.read));
async function load() { await run(async () => { await store.load(); loaded.value = true; }); }
onMounted(load);
const validDate = value => Number.isFinite(Date.parse(value));
</script>
<template>
  <section class="plots-page account-page">
    <h1>{{ t('navigation.notifications') }}</h1>
    <div class="list-toolbar"><pv-select-button v-model="filter" :allow-empty="false" :options="[{label: t('inbox.all'), value: 'all'}, {label: t('inbox.unread'), value: 'unread'}]" option-label="label" option-value="value" :aria-label="t('inbox.filter')" /><pv-button :label="t('workspace.refresh')" @click="load" :disabled="busy" /></div>
    <request-status :busy="busy" :error="error" :success="success" />
    <ul v-if="loaded && filtered.length" class="activity-list notification-list">
      <li v-for="notification in filtered" :key="notification.id" class="account-card" :class="{'notification-unread': !notification.read}">
        <h2>{{ notification.title || t('navigation.notifications') }}</h2>
        <p>{{ notification.message || notification.content }}</p>
        <p v-if="validDate(notification.createdAt)">{{ d(new Date(notification.createdAt)) }}</p>
        <div class="form-actions"><router-link v-if="notificationLink(notification)" :to="notificationLink(notification)" class="action-link">{{ t('inbox.open') }}</router-link><pv-button v-if="!notification.read" :label="t('inbox.markRead')" @click="run(() => store.markRead(notification.id))" :disabled="busy" /><span v-else>{{ t('inbox.read') }}</span></div>
      </li>
    </ul>
    <p v-else-if="loaded && !error" class="empty-state">{{ t('inbox.empty') }}</p>
  </section>
</template>
