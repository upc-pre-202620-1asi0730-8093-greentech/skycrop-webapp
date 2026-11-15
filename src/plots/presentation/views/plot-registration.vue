<script setup>
import {useI18n} from 'vue-i18n';
import {computed, onMounted, reactive, ref} from 'vue';
import {useRouter} from 'vue-router';
import {storeToRefs} from 'pinia';
import {usePlotsStore} from '../../application/plots.store.js';
import {PlotLocationApi} from '../../infrastructure/plot-location-api.js';
import PlotMap from '../components/plot-map.vue';

const {t, locale} = useI18n();
const router = useRouter();
const store = usePlotsStore();
const {saving, error} = storeToRefs(store);
const locationApi = new PlotLocationApi();
const form = reactive({name: '', personInCharge: '', cropType: '', soilType: '', sowingDate: '', areaHectares: '', location: '', latitude: '', longitude: '', imageUrl: ''});
const search = ref('');
const searching = ref(false);
const locations = ref([]);
const locationMessage = ref('');
const coordinates = computed(() => ({latitude: form.latitude === '' ? null : Number(form.latitude), longitude: form.longitude === '' ? null : Number(form.longitude)}));
const coordinatesValid = computed(() => (form.latitude === '' && form.longitude === '')
  || (form.latitude !== '' && form.longitude !== '' && Number.isFinite(coordinates.value.latitude) && Number.isFinite(coordinates.value.longitude)
    && Math.abs(coordinates.value.latitude) <= 90 && Math.abs(coordinates.value.longitude) <= 180));
const valid = computed(() => form.name.trim() && form.personInCharge.trim() && form.cropType.trim()
  && form.soilType.trim() && form.sowingDate && form.location.trim() && coordinatesValid.value
  && Number.isFinite(Number(form.areaHectares)) && Number(form.areaHectares) > 0
  && (!form.imageUrl || /^https?:\/\//i.test(form.imageUrl.trim())));

onMounted(() => { store.error = ''; });
function selectPoint(point) {
  form.latitude = point.latitude;
  form.longitude = point.longitude;
  if (!form.location.trim()) form.location = `${point.latitude}, ${point.longitude}`;
}
function selectLocation(location) {
  form.location = location.display_name;
  selectPoint({latitude: Number(location.lat), longitude: Number(location.lon)});
  locations.value = [];
}
async function searchLocation() {
  if (!search.value.trim() || searching.value || saving.value) return;
  searching.value = true;
  locationMessage.value = '';
  locations.value = [];
  try {
    locations.value = await locationApi.search(search.value, locale.value);
    if (!locations.value.length) locationMessage.value = 'plots.noLocations';
  } catch { locationMessage.value = 'plots.locationError'; }
  finally { searching.value = false; }
}
async function registerPlot() {
  if (!valid.value || saving.value) return;
  const plot = await store.registerPlot({...form, ...coordinates.value, areaHectares: Number(form.areaHectares)});
  if (plot) await router.push({name: 'plot-details', params: {id: plot.id}, query: {registered: 'true'}});
}
</script>

<template>
  <section class="plots-page plot-registration-page">
    <router-link class="action-link back-link" to="/plots">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      <span>{{ t('plots.back') }}</span>
    </router-link>    <h1>{{ t('plots.registrationTitle') }}</h1>
    <form @submit.prevent="registerPlot">
      <div class="plot-registration-grid">
        <fieldset class="plot-card" :disabled="saving">
          <legend>{{ t('plots.basicInformation') }}</legend>
          <div v-for="field in ['name', 'personInCharge', 'cropType', 'soilType']" :key="field" class="form-field">
            <label :for="`plot-${field}`">{{ t(`plots.${field}`) }}</label>
            <pv-input-text :id="`plot-${field}`" v-model="form[field]" required maxlength="100" />
          </div>
          <div class="form-field">
            <label for="plot-sowing-date">{{ t('plots.sowingDate') }}</label>
            <pv-input-text id="plot-sowing-date" v-model="form.sowingDate" type="date" required />
          </div>
          <div class="form-field">
            <label for="plot-area">{{ t('plots.area') }}</label>
            <pv-input-text id="plot-area" v-model="form.areaHectares" type="number" min="0" step="any" required aria-describedby="area-help" />
            <small id="area-help">{{ t('plots.areaHelp') }}</small>
          </div>
        </fieldset>
        <fieldset class="plot-card plot-location-section" :disabled="saving">
          <legend>{{ t('plots.location') }}</legend>
          <div class="form-field">
            <label for="plot-location-search">{{ t('plots.locationSearch') }}</label>
            <div class="location-search-row">
              <pv-input-text id="plot-location-search" v-model="search" aria-describedby="map-search-help" @keydown.enter.prevent="searchLocation" />
              <pv-button type="button" :label="t(searching ? 'plots.searchingLocation' : 'plots.searchLocation')" :disabled="!search.trim() || searching || saving" @click="searchLocation" />
            </div>
            <small id="map-search-help">{{ t('plots.mapSearchHelp') }}</small>
            <ul v-if="locations.length" class="location-results">
              <li v-for="location in locations" :key="location.place_id"><button type="button" @click="selectLocation(location)">{{ location.display_name }}</button></li>
            </ul>
            <p v-if="locationMessage" role="status">{{ t(locationMessage) }}</p>
          </div>
          <PlotMap :latitude="coordinatesValid ? coordinates.latitude : null" :longitude="coordinatesValid ? coordinates.longitude : null" editable :disabled="saving" @select="selectPoint" />
          <small>{{ t('plots.mapHelp') }}</small>
          <div class="form-field">
            <label for="plot-location">{{ t('plots.locationDescription') }}</label>
            <pv-textarea id="plot-location" v-model="form.location" required rows="2" maxlength="500" />
          </div>
          <div class="coordinate-fields">
            <div v-for="field in ['latitude', 'longitude']" :key="field" class="form-field">
              <label :for="`plot-${field}`">{{ t(`plots.${field}`) }}</label>
              <pv-input-text :id="`plot-${field}`" v-model="form[field]" type="number" step="any" :min="field === 'latitude' ? -90 : -180" :max="field === 'latitude' ? 90 : 180" />
            </div>
          </div>
          <p v-if="!coordinatesValid" role="alert">{{ t('plots.invalidCoordinates') }}</p>
        </fieldset>
      </div>
      <div class="form-field plot-image-field">
        <label for="plot-image">{{ t('plots.imageUrl') }}</label>
        <pv-input-text id="plot-image" v-model="form.imageUrl" type="url" :disabled="saving" />
      </div>
      <p v-if="error" class="error-message" role="alert">{{ t(error) }}</p>
      <div class="form-actions">
        <router-link v-if="!saving" to="/plots">{{ t('plots.cancel') }}</router-link>
        <pv-button type="submit" :label="t(saving ? 'plots.registering' : 'plots.register')" :disabled="!valid || saving" />
      </div>
    </form>
  </section>
</template>
