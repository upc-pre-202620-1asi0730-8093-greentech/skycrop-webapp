<script setup>
import {computed, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useDronesStore} from '../../application/drones.store.js';
import DroneImage from '../components/drone-image.vue';
import FlightRouteEditor from '../components/flight-route-editor.vue';
const route = useRoute(),
  {t, locale} = useI18n(),
  store = useDronesStore(),
  tab = ref('summary'),
  selectedFlight = ref(null);
const drone = computed(() => store.selectedDrone);
const flights = computed(() =>
  store.flights
    .filter((item) => String(item.droneId) === String(drone.value?.id))
    .sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt)),
);
const images = computed(() =>
  store.images.filter((item) =>
    flights.value.some((flight) => String(flight.id) === String(item.flightId)),
  ),
);
const completed = computed(
  () => flights.value.filter((item) => item.status === 'COMPLETED').length,
);
const tabs = ['summary', 'details', 'analytics', 'files', 'options'];
function plotName(id) {
  return store.plots.find((item) => String(item.id) === String(id))?.name || t('drones.none');
}
function date(value) {
  return value && !isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat(locale.value, {dateStyle: 'short', timeStyle: 'short'}).format(
        new Date(value),
      )
    : t('drones.none');
}
function imageUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
watch(
  () => route.params.id,
  (id) => {
    tab.value = 'summary';
    selectedFlight.value = null;
    store.load(id);
  },
  {immediate: true},
);
</script>
<template>
  <section class="plots-page drones-page" :aria-busy="store.loading">
    <router-link class="action-link back-link" to="/drones">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      <span>{{ t('drones.back') }}</span>
    </router-link>    <h1>{{ t('drones.information') }}</h1>
    <p v-if="store.loading" role="status">{{ t('plots.loading') }}</p>
    <p v-else-if="store.notFound" class="empty-state">{{ t('drones.notFound') }}</p>
    <div v-else-if="!drone" role="alert" class="error-message">
      <p>{{ t(store.error || 'drones.loadError') }}</p>
      <pv-button :label="t('plots.retry')" @click="store.load(route.params.id)" />
    </div>
    <template v-else>
      <nav class="drone-tabs" :aria-label="t('drones.information')">
        <button
          v-for="item in tabs"
          :key="item"
          :aria-current="tab === item ? 'page' : undefined"
          @click="
            tab = item;
            selectedFlight = null;
          "
        >
          {{ t(`drones.${item}`) }}
        </button>
      </nav>
      <p v-if="store.error" role="alert" class="error-message">{{ t(store.error) }}</p>
      <div v-if="tab === 'summary'">
        <div class="drone-summary">
          <div class="plot-card">
            <h2>{{ t('plots.basicInformation') }}</h2>
            <dl class="plot-details">
              <dt>{{ t('drones.name') }}</dt>
              <dd>{{ drone.name }}</dd>
              <dt>{{ t('drones.model') }}</dt>
              <dd>{{ drone.model }}</dd>
              <dt>{{ t('drones.camera') }}</dt>
              <dd>{{ drone.camera }}</dd>
              <dt>{{ t('drones.plot') }}</dt>
              <dd>{{ plotName(flights[0]?.plotId) }}</dd>
              <dt>{{ t('drones.status') }}</dt>
              <dd>{{ t(`drones.${drone.status}`) }}</dd>
              <dt>{{ t('drones.battery') }}</dt>
              <dd>{{ drone.battery }}%</dd>
              <dt>{{ t('drones.autonomy') }}</dt>
              <dd>{{ drone.autonomyMinutes }} min</dd>
            </dl>
          </div>
          <DroneImage :src="drone.imageUrl" :name="drone.name" />
        </div>
        <div class="plot-card">
          <h2>{{ t('drones.activity') }}</h2>
          <p v-if="!flights.length">{{ t('drones.noFlights') }}</p>
          <article v-for="flight in flights" :key="flight.id" class="drone-activity">
            <div>
              <p>
                {{ date(flight.startedAt || flight.createdAt) }} · {{ plotName(flight.plotId) }}
              </p>
              <p>
                {{ t('drones.status') }}: {{ t(`drones.${flight.status}`) }} ·
                {{ t('drones.duration') }}: {{ flight.durationMinutes ?? t('drones.none') }} ·
                {{ t('drones.images') }}:
                {{ images.filter((item) => String(item.flightId) === String(flight.id)).length }}
              </p>
            </div>
            <pv-button :label="t('plots.details')" @click="selectedFlight = flight" /><pv-button
              v-if="flight.status === 'PLANNED'"
              :label="t('drones.cancelFlight')"
              :disabled="store.saving"
              @click="store.cancelFlight(flight.id)"
            />
          </article>
        </div>
        <div v-if="selectedFlight" class="plot-card drone-flight-details">
          <h2>{{ t('drones.flightDetails') }} #{{ selectedFlight.id }}</h2>
          <p>{{ t('drones.plot') }}: {{ plotName(selectedFlight.plotId) }}</p>
          <p>
            {{ t('drones.routeName') }}:
            {{
              store.routes.find((item) => String(item.id) === String(selectedFlight.flightRouteId))
                ?.name || t('drones.none')
            }}
          </p>
          <p>
            {{ t('drones.status') }}:
            {{
              t(
                `drones.${store.flights.find((item) => item.id === selectedFlight.id)?.status || selectedFlight.status}`,
              )
            }}
          </p>
        </div>
      </div>
      <FlightRouteEditor v-else-if="tab === 'details'" />
      <div v-else-if="tab === 'analytics'" class="drone-statistics">
        <div
          v-for="metric in [
            {label: 'flights', value: flights.length},
            {label: 'completed', value: completed},
            {label: 'images', value: images.length},
          ]"
          :key="metric.label"
          class="plot-card"
        >
          <h2>{{ t(`drones.${metric.label}`) }}</h2>
          <p>{{ metric.value }}</p>
        </div>
      </div>
      <div v-else-if="tab === 'files'" class="plot-card">
        <h2>{{ t('drones.files') }}</h2>
        <p v-if="!images.length">{{ t('drones.noFiles') }}</p>
        <ul v-else>
          <li v-for="file in images" :key="file.id">
            <a
              v-if="imageUrl(file.imageUrl || file.url)"
              :href="imageUrl(file.imageUrl || file.url)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ file.name || `${t('drones.image')} #${file.id}` }}</a
            ><span v-else
              >{{ file.name || `${t('drones.image')} #${file.id}` }} · {{ t('drones.none') }}</span
            >
          </li>
        </ul>
      </div>
      <div v-else class="plot-card">
        <h2>{{ t('drones.connection') }}</h2>
        <p>{{ t('drones.serialNumber') }}: {{ drone.serialNumber }}</p>
        <p>{{ t('drones.status') }}: {{ t(`drones.${drone.status}`) }}</p>
        <pv-button
          :label="t(drone.status === 'DISCONNECTED' ? 'drones.connect' : 'drones.disconnect')"
          :disabled="
            store.saving ||
            !['AVAILABLE', 'DISCONNECTED'].includes(drone.status) ||
            flights.some((item) => ['PLANNED', 'IN_PROGRESS'].includes(item.status))
          "
          :loading="store.saving"
          @click="store.setConnection(drone.status === 'DISCONNECTED')"
        />
      </div>
    </template>
  </section>
</template>
