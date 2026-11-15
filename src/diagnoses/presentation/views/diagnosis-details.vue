<script setup>
import {computed, watch} from 'vue';
import {useRoute} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useDiagnosesStore} from '../../application/diagnoses.store.js';
import DiagnosisMap from '../components/diagnosis-map.vue';
const route = useRoute(),
  {t, locale, n} = useI18n(),
  store = useDiagnosesStore();
const diagnosis = computed(() => store.selectedDiagnosis);
const plot = computed(() =>
  store.plots.find((item) => String(item.id) === String(diagnosis.value?.plotId)),
);
const date = (value) =>
  new Intl.DateTimeFormat(locale.value, {dateStyle: 'short', timeStyle: 'short'}).format(
    new Date(value),
  );
watch(
  () => route.params.id,
  (id) => store.fetchDiagnoses(id),
  {immediate: true},
);
</script>
<template>
  <section class="plots-page diagnoses-page" :aria-busy="store.loading">
    <router-link class="action-link back-link" to="/diagnoses">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      <span>{{ t('diagnoses.back') }}</span>
    </router-link>
    <h1>{{ t('diagnoses.detailsTitle') }}</h1>
    <p v-if="store.loading" role="status">{{ t('plots.loading') }}</p>
    <p v-else-if="store.notFound" class="empty-state">{{ t('diagnoses.notFound') }}</p>
    <div v-else-if="store.error" role="alert" class="error-message">
      <p>{{ t(store.error) }}</p>
      <pv-button :label="t('plots.retry')" @click="store.fetchDiagnoses(route.params.id)" />
    </div>
    <template v-else-if="diagnosis"
      >
      <p v-if="store.relatedError" role="status" class="error-message">
        {{ t(store.relatedError) }}
      </p>
      <div class="diagnosis-detail-grid">
        <div class="plot-card">
          <h2>{{ t('plots.basicInformation') }}</h2>
          <dl class="plot-details">
            <dt>ID</dt>
            <dd>{{ diagnosis.id }}</dd>
            <dt>{{ t('diagnoses.date') }}</dt>
            <dd>{{ date(diagnosis.generatedAt) }}</dd>
            <dt>{{ t('diagnoses.plot') }}</dt>
            <dd>
              <router-link v-if="plot" :to="`/plots/${plot.id}`">{{ plot.name }}</router-link
              ><span v-else>{{ diagnosis.plotId ?? t('diagnoses.unavailable') }}</span>
            </dd>
            <dt>{{ t('diagnoses.flight') }}</dt>
            <dd>{{ diagnosis.flightId ?? t('diagnoses.withoutFlight') }}</dd>
            <dt>{{ t('diagnoses.status') }}</dt>
            <dd>{{ t(`diagnoses.${diagnosis.status}`) }}</dd>
            <dt>{{ t('reports.averageNdvi') }}</dt>
            <dd>
              {{
                diagnosis.averageNdvi === null
                  ? t('diagnoses.unavailable')
                  : n(diagnosis.averageNdvi, {maximumFractionDigits: 3})
              }}
            </dd>
          </dl>
          <h2>{{ t('diagnoses.observations') }}</h2>
          <p>{{ diagnosis.observations }}</p>
        </div>
        <DiagnosisMap :key="diagnosis.id" class="plot-card" :anomalies="diagnosis.anomalies" />
      </div>
      <div class="plot-card">
        <h2>{{ t('diagnoses.anomalies') }}</h2>
        <p v-if="!diagnosis.anomalies.length">{{ t('diagnoses.noAnomalies') }}</p>
        <article
          v-for="(anomaly, index) in diagnosis.anomalies"
          :key="anomaly.id ?? index"
          class="diagnosis-anomaly"
        >
          <h3>{{ t(`diagnoses.${anomaly.type}`) }}</h3>
          <p>{{ t('diagnoses.severity') }}: {{ t(`diagnoses.${anomaly.severity}`) }}</p>
          <p>{{ anomaly.description }}</p>
          <p>{{ t('diagnoses.location') }}: {{ anomaly.location }}</p>
          <p v-if="anomaly.latitude !== null">
            {{ t('plots.latitude') }}: {{ anomaly.latitude }} · {{ t('plots.longitude') }}:
            {{ anomaly.longitude }}
          </p>
        </article>
      </div></template
    >
  </section>
</template>
