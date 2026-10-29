
<script setup>
import {computed, onMounted} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {storeToRefs} from 'pinia';
import {useCropsStore} from '../../application/crops.store.js';
import {usePlotsStore} from '../../../plots/application/plots.store.js';

const route = useRoute();
const router = useRouter();
const {t, n} = useI18n();

const cropsStore = useCropsStore();
const {selectedCrop, loading, error, notFound} = storeToRefs(cropsStore);

const plotsStore = usePlotsStore();
const {plots} = storeToRefs(plotsStore);

const plot = computed(() =>
    plots.value.find(plot => String(plot.id) === String(route.params.id))
);

const crop = computed(() =>
    selectedCrop.value &&
    String(selectedCrop.value.id) === String(route.params.cropId) &&
    String(selectedCrop.value.plotId) === String(route.params.id)
        ? selectedCrop.value
        : null
);

const statusLabel = computed(() => {
  if (!crop.value) return '';

  if (crop.value.status === 'ACTIVE') return t('crops.active');
  if (crop.value.status === 'IN_PROGRESS') return t('crops.inProgress');
  if (crop.value.status === 'COMPLETED') return t('crops.completed');

  return crop.value.status;
});

const idealHumidity = computed(() => {
  if (!crop.value) return t('crops.notSpecified');

  const min = crop.value.idealHumidityMin;
  const max = crop.value.idealHumidityMax;

  if (min == null && max == null) {
    return t('crops.notSpecified');
  }

  if (min != null && max != null) {
    return `${n(min)}% - ${n(max)}%`;
  }

  return `${n(min ?? max)}%`;
});

const editCrop = () => {
  router.push({
    name: 'crop-edit',
    params: {
      id: route.params.id,
      cropId: route.params.cropId
    }
  });
};

const back = () => {
  router.push(`/plots/${route.params.id}/crops`);
};

onMounted(() => {
  cropsStore.fetchCrop(route.params.cropId);
  plotsStore.fetchPlots();
});
</script>

<template>
  <section class="plots-page crop-details">
    <p class="mb-3">
      <router-link to="/plots">
        {{ t('navigation.plots') }}
      </router-link>
      /
      <router-link :to="`/plots/${route.params.id}/crops`">
        {{ t('crops.title') }}
      </router-link>
      / {{ t('crops.details') }}
    </p>

    <div class="page-heading">
      <h1>{{ t('crops.details') }}</h1>
    </div>

    <p v-if="loading" role="status">
      {{ t('crops.loading') }}
    </p>

    <p v-else-if="error" class="error-message" role="alert">
      {{ t('crops.loadError') }}
    </p>

    <p v-else-if="notFound || !crop" class="empty-state">
      {{ t('crops.notFound') }}
    </p>

    <template v-else>
      <div class="plot-card crop-details-card">
        <h2>{{ crop.name }}</h2>

        <dl class="crop-details-information">
          <dt>{{ t('crops.variety') }}</dt>
          <dd>{{ crop.variety }}</dd>

          <dt>{{ t('crops.plot') }}</dt>
          <dd>{{ plot?.name || crop.plotId }}</dd>

          <dt>{{ t('crops.plantingDate') }}</dt>
          <dd>{{ crop.plantingDate }}</dd>

          <dt>{{ t('crops.expectedHarvest') }}</dt>
          <dd>{{ crop.expectedHarvest || '-' }}</dd>

          <dt>{{ t('crops.status') }}</dt>
          <dd>{{ statusLabel }}</dd>

          <dt>{{ t('crops.plantedArea') }}</dt>
          <dd>{{ crop.plantedAreaHectares == null
              ? '-'
              : n(crop.plantedAreaHectares) }}</dd>

          <dt>{{ t('crops.sowingMethod') }}</dt>
          <dd>{{ crop.sowingMethod || '-' }}</dd>

          <dt>{{ t('crops.irrigationType') }}</dt>
          <dd>{{ crop.irrigationType || '-' }}</dd>

          <dt>{{ t('crops.soilType') }}</dt>
          <dd>{{ crop.soilType || '-' }}</dd>

          <dt>{{ t('crops.notes') }}</dt>
          <dd>{{ crop.notes || '-' }}</dd>
        </dl>
      </div>

      <div class="plot-card crop-details-card">
        <h2>{{ t('crops.technicalInformation') }}</h2>

        <dl class="crop-details-information">
          <dt>{{ t('crops.growthStage') }}</dt>
          <dd>{{ crop.growthStage || t('crops.notSpecified') }}</dd>

          <dt>{{ t('crops.idealHumidity') }}</dt>
          <dd>{{ idealHumidity }}</dd>
        </dl>
      </div>

      <div class="form-actions">
        <pv-button
            :label="t('crops.edit')"
            icon="pi pi-pencil"
            @click="editCrop"
        />

        <pv-button
            :label="t('crops.backToList')"
            severity="secondary"
            icon="pi pi-arrow-left"
            @click="back"
        />
      </div>
    </template>
  </section>
</template>
