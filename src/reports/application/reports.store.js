import {defineStore} from 'pinia';
import {ref, shallowRef} from 'vue';
import {ReportsApi} from '../infrastructure/reports-api.js';
import {ReportAssembler} from '../infrastructure/report.assembler.js';
import {createSeasonalReport} from '../domain/model/seasonal-report.js';

const reportsApi = new ReportsApi();

export const useReportsStore = defineStore('reports', () => {

  const reports = shallowRef([]),
    selectedReport = shallowRef(null),
    loading = ref(false),
    saving = ref(false),
    error = ref(''),
    notFound = ref(false);
  let requestId = 0;


  async function load(id) {
    const request = ++requestId;
    loading.value = true;
    error.value = '';
    notFound.value = false;
    selectedReport.value = null;
    try {
      const responses = await Promise.all([
        reportsApi.getReports(),
        ...(id === undefined ? [] : [reportsApi.getReportById(id)]),
      ]);
      if (request !== requestId) return;
      reports.value = responses[0].data
        .map(ReportAssembler.toEntityFromResource)
        .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
      if (id !== undefined)
        selectedReport.value = ReportAssembler.toEntityFromResource(responses[1].data);
    } catch (failure) {
      if (request === requestId) {
        notFound.value = id !== undefined && failure.response?.status === 404;
        if (!notFound.value) error.value = 'reports.loadError';
      }
    } finally {
      if (request === requestId) loading.value = false;
    }
  }


  async function generate(attributes) {
    if (saving.value) return null;
    saving.value = true;
    error.value = '';
    try {
      const sources = (await reportsApi.getReports()).data.map(ReportAssembler.toEntityFromResource);
      const entity = createSeasonalReport(sources, attributes);
      const response = await reportsApi.createReport({
        ...ReportAssembler.toResourceFromEntity(entity),
        startDate: attributes.startDate,
        endDate: attributes.endDate,
      });
      return ReportAssembler.toEntityFromResource(response.data);
    } catch (failure) {
      error.value =
        failure.message === 'Insufficient reports' ? 'reports.insufficient' : 'reports.saveError';
      return null;
    } finally {
      saving.value = false;
    }
  }
  return {reports, selectedReport, loading, saving, error, notFound, load, generate};
});
