<script setup>
import {useDiagnosesStore} from '../../application/diagnoses.store.js';
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {onMounted} from "vue";

const {t, locale} = useI18n()

const diagnosesStore = useDiagnosesStore()

const {diagnoses, plots, loading, error} = storeToRefs(diagnosesStore);

const plotName = (id) =>
    plots.value.find((item) => String(item.id) === String(id))?.name || t('diagnoses.unavailable');

const date = (value) =>
    Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale.value, {dateStyle: 'short', timeStyle: 'short'}).format(
        new Date(value),
    ) : t('diagnoses.unavailable');

const severity = (anomalies) => anomalies[0]?.severity;

onMounted(() => {
  diagnosesStore.fetchDiagnoses();
});

</script>


<template>
  <p v-if="loading" role="status">{{ t('diagnoses.loading') }}</p>
  <div v-else-if="error" class="error-message" role="alert"><p>{{ t(error) }}</p><pv-button :label="t('workspace.retry')" @click="diagnosesStore.fetchDiagnoses()" /></div>

  <template v-if="!loading && (!error)"
  ><p v-if="!diagnoses.length" class="empty-state">
    {{ t('diagnoses.empty') }}
  </p>
    <div v-else class="diagnoses-grid">

      <article
          v-for="diagnostic in diagnoses.slice(0, 3)"
          :key="diagnostic.id"

      >
        <div class="diagnoses-grid-card">
          <h2>
            {{ t('diagnoses.homeSummary') }}
            {{ diagnostic.topAnomaly ? t(`diagnoses.${diagnostic.topAnomaly}`) : t('diagnoses.noAnomalies')
            }}
          </h2>

          <p>
            {{ t('diagnoses.detectedDate') }}
            {{ date(diagnostic.generatedAt) }}
          </p>

          <p>
            {{ t('diagnoses.affectedPlot') }}
            {{ plotName(diagnostic.plotId) }}
          </p>

          <p>
            {{ t('diagnoses.severity') }}
            {{ diagnostic.topAnomaly ? t(`diagnoses.${severity(diagnostic.anomalies)}`) : t('diagnoses.noAnomalies')}}
          </p>

          <p>
            {{ t('diagnoses.status') }}
            {{ t(`diagnoses.${diagnostic.status}`) }}
          </p>

          <router-link
              class="action-link"
              :to="`/diagnoses/${diagnostic.id}`"
              :aria-label="`${t('plots.details')}: ${diagnostic.id}`"
          >{{ t('plots.details') }}</router-link
          >
        </div>
      </article>
    </div>
  </template>

</template>


<style scoped>

</style>