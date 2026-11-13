<script setup>
import {useI18n} from 'vue-i18n';
import {watch} from 'vue';
import {useRoute} from 'vue-router';
import {storeToRefs} from 'pinia';
import PlotMap from '../components/plot-map.vue';
import PlotImage from '../components/plot-image.vue';
import {usePlotsStore} from '../../application/plots.store.js';

const {t, n, locale} = useI18n();
const route = useRoute();
const store = usePlotsStore();
const {selectedPlot: plot, loading, error, notFound} = storeToRefs(store);
watch(() => route.params.id, id => store.fetchPlot(id), {immediate: true});

function formatDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return t('plots.notAvailable');
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-PE' : 'en', {dateStyle: 'medium'}).format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value));
}
</script>

<template>
  <section class="plots-page" :aria-busy="loading">
    <router-link class="action-link back-link" to="/plots">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      <span>{{ t('plots.back') }}</span>
    </router-link>
    <p v-if="loading" role="status">{{ t('plots.loadingDetails') }}</p>
    <div v-else-if="error" class="error-message" role="alert">
      <p>{{ t(error) }}</p>
      <pv-button :label="t('plots.retry')" @click="store.fetchPlot(route.params.id)" />
    </div>
    <div v-else-if="notFound" class="empty-state">
      <h1>{{ t('plots.notFound') }}</h1>
      <p>{{ t('plots.notFoundDescription') }}</p>
    </div>
    <template v-else-if="plot">
      <p v-if="route.query.registered === 'true'" class="success-message" role="status">{{ t('plots.registered') }}</p>
      <h1>{{ plot.name }}</h1>
      <div class="plot-detail-grid">
        <div class="plot-card">
          <h2>{{ t('plots.basicInformation') }}</h2>
          <PlotImage :src="plot.imageUrl" :name="plot.name" />
          <dl class="plot-details">
            <dt>{{ t('plots.personInCharge') }}</dt><dd>{{ plot.personInCharge || t('plots.notAvailable') }}</dd>
            <dt>{{ t('plots.cropType') }}</dt><dd>{{ plot.cropType || t('plots.notAvailable') }}</dd>
            <dt>{{ t('plots.soilType') }}</dt><dd>{{ plot.soilType || t('plots.notAvailable') }}</dd>
            <dt>{{ t('plots.sowingDate') }}</dt><dd>{{ formatDate(plot.sowingDate) }}</dd>
            <dt>{{ t('plots.surface') }}</dt><dd>{{ n(plot.areaHectares) }} ha</dd>
            <dt>{{ t('plots.status') }}</dt><dd>{{ t(plot.status === 'ACTIVE' ? 'plots.active' : 'plots.inactive') }}</dd>
            <dt>{{ t('plots.registeredOn') }}</dt><dd>{{ formatDate(plot.createdAt) }}</dd>
          </dl>
          <div class="plot-card-actions">
            <router-link
                class="action-link"
                :to="`/plots/${plot.id}/crops`"
            >
              <i class="pi pi-leaf" aria-hidden="true"></i>
              <span>{{ t('plots.cropsLink') }}</span>
            </router-link>

            <router-link
                class="action-link"
                :to="`/plots/${plot.id}/members`"
            >
              <i class="pi pi-users" aria-hidden="true"></i>
              <span>{{ t('workspace.members') }}</span>
            </router-link>
          </div>
        </div>
        <div class="plot-card">
          <h2>{{ t('plots.location') }}</h2>
          <p>{{ plot.location }}</p>
          <PlotMap v-if="plot.latitude !== null && plot.longitude !== null" :latitude="plot.latitude" :longitude="plot.longitude" />
          <p v-else>{{ t('plots.mapNotSelected') }}</p>
          <dl v-if="plot.latitude !== null" class="plot-details">
            <dt>{{ t('plots.latitude') }}</dt><dd>{{ plot.latitude }}</dd>
            <dt>{{ t('plots.longitude') }}</dt><dd>{{ plot.longitude }}</dd>
          </dl>
        </div>
      </div>
    </template>
  </section>
</template>
