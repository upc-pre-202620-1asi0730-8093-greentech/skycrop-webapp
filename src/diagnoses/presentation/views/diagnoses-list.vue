<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {useDiagnosesStore} from '../../application/diagnoses.store.js';
import {diagnosisScenarios} from '../../domain/model/diagnosis-scenarios.js';
const {t, locale} = useI18n(),
  store = useDiagnosesStore(),
  router = useRouter();
const search = ref(''),
  status = ref(''),
  showGenerate = ref(false);
const page = ref(0),
  pageSize = ref(5);
const form = reactive({plotId: null, flightId: null, scenario: 'WATER_STRESS'});
const plotName = (id) =>
  store.plots.find((item) => String(item.id) === String(id))?.name || t('diagnoses.unavailable');
const date = (value) =>
  new Intl.DateTimeFormat(locale.value, {dateStyle: 'short', timeStyle: 'short'}).format(
    new Date(value),
  );
const filtered = computed(() =>
  store.diagnoses.filter(
    (item) =>
      `${item.id} ${plotName(item.plotId)} ${item.observations} ${item.topAnomaly ? t(`diagnoses.${item.topAnomaly}`) : t('diagnoses.noAnomalies')}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()) &&
      (!status.value || item.status === status.value),
  ),
);
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const visibleDiagnoses = computed(() =>
  filtered.value.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value),
);
watch([search, status, pageSize], () => {
  page.value = 0;
});
watch(pageCount, (count) => {
  page.value = Math.min(page.value, count - 1);
});
const statuses = computed(() => [
  {label: t('diagnoses.allStatuses'), value: ''},
  ...['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((value) => ({
    value,
    label: t(`diagnoses.${value}`),
  })),
]);
const plots = computed(() => store.plots.map((item) => ({label: item.name, value: item.id})));
const flights = computed(() => [
  {label: t('diagnoses.withoutFlight'), value: null},
  ...store.flights
    .filter((item) => String(item.plotId) === String(form.plotId) && item.status === 'COMPLETED')
    .map((item) => ({label: `#${item.id}`, value: item.id})),
]);
const scenarios = computed(() =>
  Object.keys(diagnosisScenarios).map((value) => ({value, label: t(`diagnoses.${value}`)})),
);
async function generate() {
  if (form.plotId === null) return;
  const result = await store.registerDiagnosis({
    ...form,
    observations: t(`diagnoses.observation${form.scenario}`),
    description: t(`diagnoses.description${form.scenario}`),
  });
  if (result) router.push(`/diagnoses/${result.id}`);
}
onMounted(() => store.fetchDiagnoses());
</script>
<template>
  <section class="plots-page diagnoses-page" :aria-busy="store.loading">
    <h1>{{ t('diagnoses.title') }}</h1>
    <div class="plot-filters">
      <div class="filter-field">
        <label for="diagnosis-search">{{ t('diagnoses.search') }}</label
        ><pv-input-text id="diagnosis-search" v-model="search" type="search" />
      </div>
      <div class="filter-field">
        <label for="diagnosis-status">{{ t('diagnoses.status') }}</label
        ><pv-select
          input-id="diagnosis-status"
          v-model="status"
          :options="statuses"
          option-label="label"
          option-value="value"
        />
      </div>
    </div>
    <div class="list-toolbar">
      <p>{{ t('plots.total', {count: filtered.length}) }}</p>
      <pv-button
        :label="t('diagnoses.generate')"
        :disabled="store.loading || store.saving || !!store.relatedError"
        :aria-expanded="showGenerate"
        @click="showGenerate = !showGenerate"
      />
    </div>
    <p v-if="store.loading" role="status">{{ t('plots.loading') }}</p>
    <p v-if="store.relatedError" role="status" class="error-message">{{ t(store.relatedError) }}</p>
    <form
      v-if="showGenerate && !store.loading"
      class="plot-card diagnosis-generation"
      @submit.prevent="generate"
    >
      <h2>{{ t('diagnoses.generate') }}</h2>
      <p v-if="!plots.length">
        {{ t('diagnoses.needPlot') }}
        <router-link to="/plots/new">{{ t('plots.add') }}</router-link>
      </p>
      <template v-else
        ><div class="diagnosis-form-grid">
          <div class="form-field">
            <label for="diagnosis-plot">{{ t('diagnoses.plot') }}</label
            ><pv-select
              input-id="diagnosis-plot"
              v-model="form.plotId"
              :options="plots"
              option-label="label"
              option-value="value"
              :disabled="store.saving"
              @change="form.flightId = null"
            />
          </div>
          <div class="form-field">
            <label for="diagnosis-flight">{{ t('diagnoses.flight') }}</label
            ><pv-select
              input-id="diagnosis-flight"
              v-model="form.flightId"
              :options="flights"
              option-label="label"
              option-value="value"
              :disabled="store.saving || form.plotId === null"
            />
          </div>
          <div class="form-field">
            <label for="diagnosis-scenario">{{ t('diagnoses.scenario') }}</label
            ><pv-select
              input-id="diagnosis-scenario"
              v-model="form.scenario"
              :options="scenarios"
              option-label="label"
              option-value="value"
              :disabled="store.saving"
            />
          </div>
        </div>
        <div class="form-actions">
          <pv-button
            type="button"
            :label="t('plots.cancel')"
            :disabled="store.saving"
            @click="showGenerate = false"
          /><pv-button
            type="submit"
            :label="t('diagnoses.save')"
            :disabled="form.plotId === null || store.saving"
            :loading="store.saving"
          /></div
      ></template>
    </form>
    <div v-if="store.error" class="error-message" role="alert">
      <p>{{ t(store.error) }}</p>
      <pv-button v-if="!showGenerate" :label="t('plots.retry')" @click="store.fetchDiagnoses()" />
    </div>
    <template v-if="!store.loading && (!store.error || showGenerate)"
      ><p v-if="!filtered.length" class="empty-state">
        {{ t(store.diagnoses.length ? 'plots.noMatches' : 'diagnoses.empty') }}
      </p>
      <div v-else class="diagnosis-table-wrap">
        <table class="diagnosis-table">
          <caption class="visually-hidden">
            {{
              t('diagnoses.title')
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">{{ t('diagnoses.date') }}</th>
              <th scope="col">{{ t('diagnoses.plot') }}</th>
              <th scope="col">{{ t('diagnoses.result') }}</th>
              <th scope="col">{{ t('diagnoses.status') }}</th>
              <th scope="col">{{ t('plots.details') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in visibleDiagnoses" :key="item.id">
              <th scope="row">{{ item.id }}</th>
              <td>{{ date(item.generatedAt) }}</td>
              <td>{{ plotName(item.plotId) }}</td>
              <td>
                {{ item.topAnomaly ? t(`diagnoses.${item.topAnomaly}`) : t('diagnoses.noAnomalies')
                }}<small v-if="item.source === 'SIMULATED'" class="diagnosis-source">{{
                  t('diagnoses.simulated')
                }}</small>
              </td>
              <td>{{ t(`diagnoses.${item.status}`) }}</td>
              <td>
                <router-link
                  class="action-link"
                  :to="`/diagnoses/${item.id}`"
                  :aria-label="`${t('plots.details')}: ${item.id}`"
                  >{{ t('plots.details') }}</router-link
                >
              </td>
            </tr>
          </tbody>
        </table>
        <div class="diagnosis-pagination">
          <label for="diagnosis-page-size">{{ t('diagnoses.pageSize') }}</label>
          <pv-select input-id="diagnosis-page-size" v-model="pageSize" :options="[5, 10, 20]" />
          <pv-button :label="t('diagnoses.previous')" :disabled="page === 0" @click="page--" />
          <span role="status">{{ page + 1 }} / {{ pageCount }}</span>
          <pv-button
            :label="t('diagnoses.next')"
            :disabled="page + 1 >= pageCount"
            @click="page++"
          />
        </div></div
    ></template>
  </section>
</template>
