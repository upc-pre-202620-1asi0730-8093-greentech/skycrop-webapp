<script setup>
import {computed, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useReportsStore} from '../../application/reports.store.js';
import NdviChart from '../components/ndvi-chart.vue';
const route = useRoute(),
  router = useRouter(),
  {t, n, locale} = useI18n(),
  store = useReportsStore();
const downloading = ref(false),
  downloadError = ref(false);
const report = computed(() => store.selectedReport);
const options = computed(() =>
  store.reports.map((item) => ({label: item.title, value: String(item.id)})),
);
const number = (value) =>
  typeof value === 'number' && Number.isFinite(value)
    ? n(value, {maximumFractionDigits: 3})
    : t('reports.unavailable');
const date = (value) =>
  new Intl.DateTimeFormat(locale.value, {dateStyle: 'short', timeStyle: 'short'}).format(
    new Date(value),
  );
async function download() {
  if (downloading.value || !report.value) return;
  downloading.value = true;
  downloadError.value = false;
  const selected = report.value;
  try {
    const {downloadReportPdf} = await import('../../infrastructure/report-pdf.js');
    await downloadReportPdf(selected, t, locale.value);
  } catch {
    downloadError.value = true;
  } finally {
    downloading.value = false;
  }
}
watch(
  () => route.params.id,
  (id) => {
    downloadError.value = false;
    store.load(id);
  },
  {immediate: true},
);
</script>
<template>
  <section class="plots-page reports-page" :aria-busy="store.loading">
    <router-link class="action-link back-link" to="/reports">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      <span>{{ t('reports.back') }}</span>
    </router-link>
    <h1>{{ t('reports.detailsTitle') }}</h1>
    <p v-if="store.loading" role="status">{{ t('plots.loading') }}</p>
    <p v-else-if="store.notFound" class="empty-state">{{ t('reports.notFound') }}</p>
    <div v-else-if="store.error" role="alert" class="error-message">
      <p>{{ t(store.error) }}</p>
      <pv-button :label="t('plots.retry')" @click="store.load(route.params.id)" />
    </div>
    <template v-else-if="report"
      ><div class="report-detail-toolbar">
        <div class="filter-field">
          <label for="report-select">{{ t('reports.report') }}</label
          ><pv-select
            input-id="report-select"
            :model-value="String(report.id)"
            :options="options"
            option-label="label"
            option-value="value"
            :disabled="downloading"
            @update:model-value="router.push(`/reports/${$event}`)"
          />
        </div>
        <pv-button
          :label="t('reports.download')"
          :loading="downloading"
          :disabled="downloading"
          @click="download"
        />
      </div>
      <p v-if="downloadError" role="alert" class="error-message">
        {{ t('reports.downloadError') }}
      </p>
      <div class="report-overview">
        <div class="plot-card">
          <h2>{{ t('plots.details') }}</h2>
          <dl class="plot-details">
            <dt>ID</dt>
            <dd>{{ report.id }}</dd>
            <dt>{{ t('reports.name') }}</dt>
            <dd>{{ report.title }}</dd>
            <dt>{{ t('reports.date') }}</dt>
            <dd>{{ date(report.generatedAt) }}</dd>
            <dt>{{ t('reports.season') }}</dt>
            <dd>
              {{ report.year }}
              {{ report.season ? t(`reports.${report.season}`) : t('reports.unavailable') }}
            </dd>
            <dt>{{ t('reports.owner') }}</dt>
            <dd>{{ report.owner || t('reports.unavailable') }}</dd>
            <dt>{{ t('reports.generatedBy') }}</dt>
            <dd>{{ report.generatedBy || t('reports.unavailable') }}</dd>
          </dl>
        </div>
        <NdviChart class="plot-card" :points="report.ndviEvolution" />
      </div>
      <div class="report-metrics">
        <article
          v-for="key in ['flights', 'areaHectares', 'alerts', 'averageNdvi']"
          :key="key"
          class="plot-card"
        >
          <h2>{{ t(`reports.${key}`) }}</h2>
          <p>
            {{ number(report.metrics[key]) }}
            {{ key === 'areaHectares' && Number.isFinite(report.metrics[key]) ? 'ha' : '' }}
          </p>
        </article>
      </div>
      <div class="plot-card">
        <h2>{{ t('reports.performance') }}</h2>
        <p v-if="!report.performance.length">{{ t('reports.noPerformance') }}</p>
        <div v-else class="report-table-wrap">
          <table class="report-table">
            <caption class="visually-hidden">
              {{
                t('reports.performance')
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t('reports.plot') }}</th>
                <th scope="col">{{ t('reports.crops') }}</th>
                <th scope="col">{{ t('reports.alerts') }}</th>
                <th scope="col">{{ t('reports.flights') }}</th>
                <th scope="col">{{ t('reports.averageNdvi') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in report.performance" :key="row.plotId ?? index">
                <th scope="row">
                  <router-link
                    v-if="row.plotId !== undefined && row.plotId !== null"
                    :to="`/plots/${row.plotId}`"
                    >{{ row.plotName || `#${row.plotId}` }}</router-link
                  ><span v-else>{{ row.plotName || t('reports.unavailable') }}</span>
                </th>
                <td>
                  {{
                    Array.isArray(row.crops)
                      ? row.crops.join(', ')
                      : row.crops || t('reports.unavailable')
                  }}
                </td>
                <td>{{ number(row.alerts) }}</td>
                <td>{{ number(row.flights) }}</td>
                <td>{{ number(row.averageNdvi) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="report.content" class="report-content">{{ report.content }}</p>
      </div>
    </template>
  </section>
</template>
