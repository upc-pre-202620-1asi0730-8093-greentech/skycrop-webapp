
<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {storeToRefs} from 'pinia';
import {usePlotsStore} from '../../../plots/application/plots.store.js';
import {useCropsStore} from '../../application/crops.store.js';

const route = useRoute();
const router = useRouter();
const {t} = useI18n();

const plotsStore = usePlotsStore();
const {plots, loading: plotsLoading, error: plotsError} = storeToRefs(plotsStore);

const cropsStore = useCropsStore();
const {
  crops,
  selectedCrop,
  loading: cropLoading,
  saving,
  error,
  notFound
} = storeToRefs(cropsStore);

const isEditing = computed(() => route.name === 'crop-edit');

const name = ref('');
const variety = ref('');
const suggestedVarieties = ref([]);

const plantingDate = ref(null);
const expectedHarvest = ref(null);
const plantedAreaHectares = ref(null);
const sowingMethod = ref('');
const irrigationType = ref('');
const soilType = ref('');
const notes = ref('');
const imageUrl = ref('');

const growthStage = ref('');
const idealHumidityMin = ref(null);
const idealHumidityMax = ref(null);

const validationMessage = ref('');

const searchVarieties = event => {
  const query = (event.query ?? '').trim().toLocaleLowerCase();

  const varieties = crops.value
      .map(crop => crop.variety)
      .filter(value => typeof value === 'string' && value.trim())
      .map(value => value.trim());

  const uniqueVarieties = [...new Set(varieties)];

  suggestedVarieties.value = uniqueVarieties.filter(value =>
      value.toLocaleLowerCase().includes(query)
  );
};

const plot = computed(() =>
    plots.value.find(item => String(item.id) === String(route.params.id))
);

const existingCrop = computed(() =>
    selectedCrop.value &&
    String(selectedCrop.value.id) === String(route.params.cropId) &&
    String(selectedCrop.value.plotId) === String(route.params.id)
        ? selectedCrop.value
        : null
);

const pageTitle = computed(() =>
    t(isEditing.value ? 'crops.edit' : 'crops.register')
);

const formatDate = date => {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDate = value => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const optionalNumber = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number(value);
};

const resetForm = () => {
  name.value = '';
  variety.value = '';
  suggestedVarieties.value = [];
  plantingDate.value = null;
  expectedHarvest.value = null;
  plantedAreaHectares.value = null;
  sowingMethod.value = '';
  irrigationType.value = '';
  soilType.value = '';
  notes.value = '';
  imageUrl.value = '';
  growthStage.value = '';
  idealHumidityMin.value = null;
  idealHumidityMax.value = null;
  validationMessage.value = '';
};

const fillForm = crop => {
  name.value = crop.name ?? '';
  variety.value = crop.variety ?? '';
  plantingDate.value = parseDate(crop.plantingDate);
  expectedHarvest.value = parseDate(crop.expectedHarvest);
  plantedAreaHectares.value = crop.plantedAreaHectares ?? null;
  sowingMethod.value = crop.sowingMethod ?? '';
  irrigationType.value = crop.irrigationType ?? '';
  soilType.value = crop.soilType ?? '';
  notes.value = crop.notes ?? '';
  imageUrl.value = crop.imageUrl ?? '';

  growthStage.value = crop.growthStage ?? '';
  idealHumidityMin.value = crop.idealHumidityMin ?? null;
  idealHumidityMax.value = crop.idealHumidityMax ?? null;
};

const cancel = () => {
  if (isEditing.value) {
    router.push(`/plots/${route.params.id}/crops/${route.params.cropId}`);
  } else {
    router.push(`/plots/${route.params.id}/crops`);
  }
};

const saveCrop = async () => {
  validationMessage.value = '';

  if (
      !plot.value ||
      !name.value.trim() ||
      !variety.value.trim() ||
      !plantingDate.value
  ) {
    validationMessage.value = 'crops.requiredFields';
    return;
  }

  if (isEditing.value && !existingCrop.value) {
    return;
  }

  const area = optionalNumber(plantedAreaHectares.value);
  const minHumidity = optionalNumber(idealHumidityMin.value);
  const maxHumidity = optionalNumber(idealHumidityMax.value);

  if (area !== null && (!Number.isFinite(area) || area <= 0)) {
    validationMessage.value = 'crops.invalidArea';
    return;
  }

  if (
      area !== null &&
      Number.isFinite(Number(plot.value.areaHectares)) &&
      area > Number(plot.value.areaHectares)
  ) {
    validationMessage.value = 'crops.exceedsPlotArea';
    return;
  }

  if (
      expectedHarvest.value &&
      expectedHarvest.value < plantingDate.value
  ) {
    validationMessage.value = 'crops.invalidHarvestDate';
    return;
  }

  const invalidHumidity = value =>
      value !== null &&
      (!Number.isFinite(value) || value < 0 || value > 100);

  if (invalidHumidity(minHumidity) || invalidHumidity(maxHumidity)) {
    validationMessage.value = 'crops.invalidHumidity';
    return;
  }

  if (
      minHumidity !== null &&
      maxHumidity !== null &&
      minHumidity > maxHumidity
  ) {
    validationMessage.value = 'crops.invalidHumidityRange';
    return;
  }

  const attributes = {
    plotId: plot.value.id,
    name: name.value.trim(),
    variety: variety.value.trim(),
    plantingDate: formatDate(plantingDate.value),
    expectedHarvest: formatDate(expectedHarvest.value),
    status: isEditing.value ? existingCrop.value.status : 'ACTIVE',
    plantedAreaHectares: area,
    sowingMethod: sowingMethod.value,
    irrigationType: irrigationType.value,
    soilType: soilType.value,
    notes: notes.value,
    imageUrl: imageUrl.value,
    growthStage: growthStage.value,
    idealHumidityMin: minHumidity,
    idealHumidityMax: maxHumidity
  };

  const savedCrop = isEditing.value
      ? await cropsStore.updateCrop(route.params.cropId, attributes)
      : await cropsStore.registerCrop(attributes);

  if (savedCrop) {
    router.push(
        isEditing.value
            ? `/plots/${plot.value.id}/crops/${savedCrop.id}`
            : `/plots/${plot.value.id}/crops`
    );
  }
};

onMounted(() => {
  plotsStore.fetchPlots();
  cropsStore.fetchCrops();
});

watch(
    () => [route.params.id, route.params.cropId],
    async () => {
      resetForm();

      if (isEditing.value) {
        await cropsStore.fetchCrop(route.params.cropId);

        if (existingCrop.value) {
          fillForm(existingCrop.value);
        }
      }
    },
    {immediate: true}
);
</script>

<template>
  <section class="plots-page crop-registration">
    <p class="mb-3">
      <router-link to="/plots">
        {{ t('navigation.plots') }}
      </router-link>
      /
      <router-link :to="`/plots/${route.params.id}/crops`">
        {{ t('crops.title') }}
      </router-link>
      / {{ pageTitle }}
    </p>

    <div class="page-heading">
      <h1>{{ pageTitle }}</h1>
      <p>
        {{ t(isEditing
          ? 'crops.editDescription'
          : 'crops.registrationDescription') }}
      </p>
    </div>

    <p v-if="plotsLoading || (isEditing && cropLoading)">
      {{ t(isEditing ? 'crops.loading' : 'crops.loadingPlot') }}
    </p>

    <p v-else-if="plotsError" class="error-message">
      {{ t('plots.loadError') }}
    </p>

    <p v-else-if="!plot" class="empty-state">
      {{ t('crops.plotNotFound') }}
    </p>

    <p v-else-if="isEditing && (notFound || !existingCrop)" class="empty-state">
      {{ t('crops.notFound') }}
    </p>

    <template v-else>
      <p v-if="validationMessage" class="error-message" role="alert">
        {{ t(validationMessage) }}
      </p>

      <p v-if="error" class="error-message" role="alert">
        {{ t(isEditing ? 'crops.updateError' : 'crops.registerError') }}
      </p>

      <div class="crop-registration-grid">
        <fieldset class="crop-registration-section" :disabled="saving">
          <legend>{{ t('crops.basicInformation') }}</legend>

          <div class="crop-registration-field">
            <label for="crop-plot">{{ t('crops.plot') }} *</label>
            <pv-input-text
                id="crop-plot"
                :model-value="plot.name"
                disabled
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-name">{{ t('crops.cropType') }} *</label>
            <pv-input-text
                id="crop-name"
                v-model="name"
                :placeholder="t('crops.cropTypePlaceholder')"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-variety">{{ t('crops.variety') }} *</label>
            <pv-auto-complete
                input-id="crop-variety"
                v-model="variety"
                :suggestions="suggestedVarieties"
                :placeholder="t('crops.varietyPlaceholder')"
                dropdown
                fluid
                @complete="searchVarieties"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-planting-date">
              {{ t('crops.plantingDate') }} *
            </label>
            <pv-date-picker
                input-id="crop-planting-date"
                v-model="plantingDate"
                date-format="dd/mm/yy"
                show-icon
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-harvest">
              {{ t('crops.expectedHarvest') }}
            </label>
            <pv-date-picker
                input-id="crop-harvest"
                v-model="expectedHarvest"
                date-format="dd/mm/yy"
                show-icon
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-area">
              {{ t('crops.plantedArea') }}
            </label>
            <pv-input-text
                id="crop-area"
                v-model="plantedAreaHectares"
                type="number"
                min="0"
                step="0.01"
                :placeholder="t('crops.plantedAreaPlaceholder')"
            />
          </div>
        </fieldset>

        <fieldset class="crop-registration-section" :disabled="saving">
          <legend>{{ t('crops.additionalInformation') }}</legend>

          <div class="crop-registration-field">
            <label for="crop-sowing-method">
              {{ t('crops.sowingMethod') }}
            </label>
            <pv-input-text
                id="crop-sowing-method"
                v-model="sowingMethod"
                :placeholder="t('crops.sowingMethodPlaceholder')"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-irrigation">
              {{ t('crops.irrigationType') }}
            </label>
            <pv-input-text
                id="crop-irrigation"
                v-model="irrigationType"
                :placeholder="t('crops.irrigationPlaceholder')"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-soil">
              {{ t('crops.soilType') }}
            </label>
            <pv-input-text
                id="crop-soil"
                v-model="soilType"
                :placeholder="t('crops.soilPlaceholder')"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-image">
              {{ t('crops.imageUrl') }}
            </label>
            <pv-input-text
                id="crop-image"
                v-model="imageUrl"
                type="url"
                :placeholder="t('crops.imagePlaceholder')"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-notes">
              {{ t('crops.notes') }}
            </label>
            <pv-textarea
                id="crop-notes"
                v-model="notes"
                rows="5"
                :placeholder="t('crops.notesPlaceholder')"
            />
          </div>
        </fieldset>

        <fieldset class="crop-registration-section" :disabled="saving">
          <legend>{{ t('crops.technicalInformation') }}</legend>

          <div class="crop-registration-field">
            <label for="crop-growth-stage">
              {{ t('crops.growthStage') }}
            </label>
            <pv-input-text
                id="crop-growth-stage"
                v-model="growthStage"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-humidity-min">
              {{ t('crops.idealHumidityMin') }}
            </label>
            <pv-input-text
                id="crop-humidity-min"
                v-model="idealHumidityMin"
                type="number"
                min="0"
                max="100"
                step="0.01"
            />
          </div>

          <div class="crop-registration-field">
            <label for="crop-humidity-max">
              {{ t('crops.idealHumidityMax') }}
            </label>
            <pv-input-text
                id="crop-humidity-max"
                v-model="idealHumidityMax"
                type="number"
                min="0"
                max="100"
                step="0.01"
            />
          </div>
        </fieldset>
      </div>

      <div class="crop-registration-actions">
        <pv-button
            :label="t('crops.cancel')"
            severity="secondary"
            :disabled="saving"
            @click="cancel"
        />

        <pv-button
            :label="t(isEditing ? 'crops.saveChanges' : 'crops.register')"
            :loading="saving"
            :disabled="saving"
            @click="saveCrop"
        />
      </div>
    </template>
  </section>
</template>
