import {defineStore} from 'pinia';
import {ref, shallowRef} from 'vue';
import {DiagnosesApi} from '../infrastructure/diagnoses-api.js';
import {DiagnosisAssembler} from '../infrastructure/diagnosis.assembler.js';
import {diagnosisScenarios} from '../domain/model/diagnosis-scenarios.js';
import {PlotsApi} from "../../plots/infrastructure/plots-api.js";
import {DronesApi} from "../../drones/infrastructure/drones-api.js";

const diagnosesApi = new DiagnosesApi();
const plotsApi = new PlotsApi();
const dronesApi = new DronesApi();

export const useDiagnosesStore = defineStore('diagnoses', () => {

  const diagnoses = shallowRef([]),
    selectedDiagnosis = shallowRef(null),
    plots = shallowRef([]),
    flights = shallowRef([]);
  const loading = ref(false),
    saving = ref(false),
    error = ref(''),
    relatedError = ref(''),
    notFound = ref(false);
  let requestId = 0;


  async function fetchDiagnoses(id) {
    const request = ++requestId;
    loading.value = true;
    error.value = '';
    relatedError.value = '';
    notFound.value = false;
    selectedDiagnosis.value = null;

    try {
      const response = id === undefined ? await diagnosesApi.getDiagnoses() : await diagnosesApi.getDiagnosticById(id);

      if (request !== requestId) return;
      if (id === undefined)
        diagnoses.value = DiagnosisAssembler.toEntitiesFromResponse(response).sort(
          (a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt),
        );
      else selectedDiagnosis.value = DiagnosisAssembler.toEntityFromResource(response.data);

      plots.value = [];
      flights.value = [];

      const related = await Promise.allSettled([plotsApi.getPlots(), dronesApi.getFlights()]);

      if (request !== requestId) return;
      if (related[0].status === 'fulfilled') plots.value = related[0].value.data;
      if (related[1].status === 'fulfilled') flights.value = related[1].value.data;
      if (related.some((item) => item.status === 'rejected'))
        relatedError.value = 'diagnoses.relatedError';
    } catch (failure) {
      if (request !== requestId) return;
      notFound.value = id !== undefined && failure.response?.status === 404;
      if (!notFound.value) error.value = 'diagnoses.loadError';
    } finally {
      if (request === requestId) loading.value = false;
    }
  }


  async function registerDiagnosis(attributes) {
    if (saving.value) return null;
    saving.value = true;
    error.value = '';

    try {
      const scenario = diagnosisScenarios[attributes.scenario];
      const currentPlots = (await plotsApi.getPlots()).data;
      const plot = currentPlots.find((item) => String(item.id) === String(attributes.plotId));

      if (!plot || !scenario) throw new Error('Invalid diagnosis selection');
      if (attributes.flightId != null) {
        const flight = (await dronesApi.getFlights()).data.find(
          (item) => String(item.id) === String(attributes.flightId),
        );
        if (!flight || String(flight.plotId) !== String(plot.id) || flight.status !== 'COMPLETED')
          throw new Error('Invalid flight');
      }

      const coordinates =
        Number.isFinite(plot.latitude) &&
        Math.abs(plot.latitude) <= 90 &&
        Number.isFinite(plot.longitude) &&
        Math.abs(plot.longitude) <= 180;

      const anomalies = scenario.type
        ? [
            {
              id: crypto.randomUUID(),
              type: scenario.type,
              severity: scenario.severity,
              description: attributes.description,
              location: plot.location || plot.name,
              latitude: coordinates ? plot.latitude : null,
              longitude: coordinates ? plot.longitude : null,
            },
          ]
        : [];

      const resource = {
        generatedAt: new Date().toISOString(),
        plotId: plot.id,
        flightId: attributes.flightId ?? null,
        source: 'SIMULATED',
        scenario: attributes.scenario,
        averageNdvi: scenario.averageNdvi,
        observations: attributes.observations,
        status: 'COMPLETED',
        anomalies,
      };

      const entity = DiagnosisAssembler.toEntityFromResource(resource);
      const response = await diagnosesApi.createDiagnostic(DiagnosisAssembler.toResourceFromEntity(entity));

      const saved = DiagnosisAssembler.toEntityFromResource(response.data);
      diagnoses.value = [saved, ...diagnoses.value];
      return saved;

    } catch {
      error.value = 'diagnoses.saveError';
      return null;
    } finally {
      saving.value = false;
    }
  }


  return {
    diagnoses,
    selectedDiagnosis,
    plots,
    flights,
    loading,
    saving,
    error,
    relatedError,
    notFound,
    fetchDiagnoses,
    registerDiagnosis,
  };
});
