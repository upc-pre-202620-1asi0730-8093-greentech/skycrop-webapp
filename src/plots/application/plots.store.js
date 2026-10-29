import {defineStore} from 'pinia';
import {ref, shallowRef} from 'vue';
import {PlotsApi} from '../infrastructure/plots-api.js';
import {AgriculturalPlotAssembler} from '../infrastructure/agricultural-plot.assembler.js';
import {AgriculturalPlot} from '../domain/model/agricultural-plot.entity.js';

export const usePlotsStore = defineStore('plots', () => {
  const api = new PlotsApi();
  const plots = shallowRef([]);
  const selectedPlot = shallowRef(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref('');
  const notFound = ref(false);
  const summaries = shallowRef({});
  const summaryError = ref('');
  let requestId = 0;

  async function fetchSummaries() {
    summaryError.value = '';
    summaries.value = {};
    try {
      const [crops, notifications, diagnoses] = await Promise.all([api.getCrops(), api.getNotifications(), api.getDiagnoses()]);
      const diagnosisPlots = new Map(diagnoses.data.map(item => [String(item.id), item.plotId]));
      const summary = {};
      for (const plot of plots.value) {
        const plotCrops = crops.data.filter(item => String(item.plotId) === String(plot.id));
        const alerts = notifications.data.filter(item => item.type === 'ANOMALY_DETECTED'
          && ['PENDING', 'SENT', 'UNREAD'].includes(item.status)
          && String(item.plotId ?? diagnosisPlots.get(String(item.diagnosisId))) === String(plot.id));
        summary[plot.id] = {crops: [...new Set(plotCrops.map(item => item.name))].join(', '), activeAlerts: alerts.length};
      }
      summaries.value = summary;
    } catch {
      summaryError.value = 'plots.summaryError';
    }
  }

  async function fetchPlots() {
    const currentRequest = ++requestId;
    loading.value = true;
    error.value = '';
    try {
      const response = await api.getPlots();
      if (currentRequest !== requestId) return;
      plots.value = AgriculturalPlotAssembler.toEntitiesFromResponse(response);
      await fetchSummaries();
    } catch {
      if (currentRequest === requestId) error.value = 'plots.loadError';
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  async function fetchPlot(id) {
    const currentRequest = ++requestId;
    loading.value = true;
    error.value = '';
    notFound.value = false;
    selectedPlot.value = null;
    try {
      const response = await api.getPlotById(id);
      if (currentRequest !== requestId) return;
      selectedPlot.value = AgriculturalPlotAssembler.toEntityFromResource(response.data);
    } catch (failure) {
      if (currentRequest !== requestId) return;
      notFound.value = failure.response?.status === 404;
      if (!notFound.value) error.value = 'plots.detailError';
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  async function registerPlot(attributes) {
    if (saving.value) return null;
    saving.value = true;
    error.value = '';
    try {
      const plot = new AgriculturalPlot({...attributes, createdAt: new Date().toISOString()});
      const response = await api.create(AgriculturalPlotAssembler.toResourceFromEntity(plot));
      const savedPlot = AgriculturalPlotAssembler.toEntityFromResource(response.data);
      plots.value = [...plots.value, savedPlot];
      return savedPlot;
    } catch {
      error.value = 'plots.registerError';
      return null;
    } finally {
      saving.value = false;
    }
  }

  return {summaries, summaryError, plots, selectedPlot, loading, saving, error, notFound, fetchPlots, fetchPlot, registerPlot};
});
