
<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {storeToRefs} from 'pinia';
import {usePlotsStore} from '../../../plots/application/plots.store.js';
import {useCropsStore} from '../../application/crops.store.js';

const route = useRoute();
const {t, n} = useI18n();

const plotsStore = usePlotsStore();
const {plots, loading: plotsLoading, error: plotsError} = storeToRefs(plotsStore);

const cropsStore = useCropsStore();
const {crops, loading: cropsLoading, error: cropsError} = storeToRefs(cropsStore);

const search = ref('');
const status = ref('');

const plot = computed(() =>
    plots.value.find(plot => String(plot.id) === String(route.params.id))
);

const plotCrops = computed(() =>
    crops.value.filter(crop => String(crop.plotId) === String(route.params.id))
);

const filteredCrops = computed(() =>
    plotCrops.value.filter(crop =>
        `${crop.name} ${crop.variety}`.toLowerCase().includes(search.value.trim().toLowerCase())
        && (!status.value || crop.status === status.value)
    )
);

const statusOptions = computed(() => [
  {label: t('crops.allStatuses'), value: ''},
  {label: t('crops.active'), value: 'ACTIVE'},
  {label: t('crops.inProgress'), value: 'IN_PROGRESS'},
  {label: t('crops.completed'), value: 'COMPLETED'}
]);

const cropStatus = value => {
  if (value === 'ACTIVE') return t('crops.active');
  if (value === 'IN_PROGRESS') return t('crops.inProgress');
  if (value === 'COMPLETED') return t('crops.completed');
  return value;
};

onMounted(() => {
  plotsStore.fetchPlots();
  cropsStore.fetchCrops();
});
</script>

<template>
  <section class="plots-page" :aria-busy="plotsLoading || cropsLoading">
    <p class="mb-3">
      <router-link to="/plots">{{ t('navigation.plots') }}</router-link>
      / {{ plot?.name || route.params.id }} / {{ t('crops.title') }}
    </p>

    <div class="page-heading">
      <h1>{{ t('crops.listTitle') }}</h1>
      <p>{{ t('crops.description') }}</p>
    </div>

    <p v-if="plotsLoading">{{ t('crops.loadingPlot') }}</p>
    <p v-else-if="plotsError" class="error-message">{{ t(plotsError) }}</p>
    <p v-else-if="!plot">{{ t('crops.plotNotFound') }}</p>

    <template v-else>
      <div class="crop-list-header">
        <div class="crop-list-plot">
          <h2>{{ plot.name }}</h2>
          <p>{{ t('plots.surface') }}: {{ n(plot.areaHectares) }} ha</p>
          <p>{{ t('plots.location') }}: {{ plot.location }}</p>
          <p>
            {{ t('plots.status') }}:
            {{ t(plot.status === 'ACTIVE' ? 'plots.active' : 'plots.inactive') }}
          </p>
        </div>

        <router-link
            class="action-link"
            :to="`/plots/${plot.id}/crops/new`"
        >
          + {{ t('crops.register') }}
        </router-link>
      </div>

      <div class="crop-list-filters">
        <div class="filter-field">
          <label for="crop-search">{{ t('crops.search') }}</label>
          <pv-input-text
              id="crop-search"
              v-model="search"
              :placeholder="t('crops.searchPlaceholder')"
          />
        </div>

        <div class="filter-field">
          <label for="crop-filter">{{ t('crops.filterStatus') }}</label>
          <pv-select
              input-id="crop-filter"
              v-model="status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
          />
        </div>
      </div>

      <p v-if="cropsLoading">{{ t('crops.loading') }}</p>
      <p v-else-if="cropsError" class="error-message">{{ t('crops.loadError') }}</p>

      <template v-else>
        <p>{{ t('crops.total', {count: filteredCrops.length}) }}</p>

        <p v-if="!plotCrops.length" class="empty-state">
          {{ t('crops.empty') }}
        </p>

        <p v-else-if="!filteredCrops.length" class="empty-state">
          {{ t('crops.noMatches') }}
        </p>

        <div v-else class="plot-grid">
          <article
              v-for="crop in filteredCrops"
              :key="crop.id"
              class="plot-card registered-plot"
          >
            <h2>{{ crop.name }}</h2>
            <p>{{ t('crops.variety') }}: {{ crop.variety }}</p>
            <p>{{ t('crops.plantingDate') }}: {{ crop.plantingDate }}</p>
            <p>{{ t('crops.expectedHarvest') }}: {{ crop.expectedHarvest || '-' }}</p>
            <p>{{ t('crops.status') }}: {{ cropStatus(crop.status) }}</p>

            <router-link :to="`/plots/${plot.id}/crops/${crop.id}`">
              {{ t('crops.details') }}
            </router-link>
          </article>
        </div>
      </template>
    </template>
  </section>
</template>
