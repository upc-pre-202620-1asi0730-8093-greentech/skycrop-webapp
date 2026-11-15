import {defineStore} from 'pinia';
import {ref, shallowRef} from 'vue';
import {DronesApi} from '../infrastructure/drones-api.js';
import {DroneAssembler} from '../infrastructure/drone.assembler.js';
import {Drone} from '../domain/model/drone.entity.js';
import {FlightRoute} from '../domain/model/flight-route.entity.js';
import {PlotsApi} from "../../plots/infrastructure/plots-api.js";

const dronesApi = new DronesApi();
const plotsApi = new PlotsApi();

export const useDronesStore = defineStore('drones', () => {

  const drones = shallowRef([]),
    selectedDrone = shallowRef(null),
    plots = shallowRef([]),
    routes = shallowRef([]),
    flights = shallowRef([]),
    images = shallowRef([]);
  const loading = ref(false),
    saving = ref(false),
    error = ref(''),
    notFound = ref(false);
  let requestId = 0;


  async function load(id) {
    const request = ++requestId;
    loading.value = true;
    error.value = '';
    notFound.value = false;
    selectedDrone.value = null;
    try {
      const response = id === undefined ? await dronesApi.getDrones() : await dronesApi.getDroneById(id);
      const related = await Promise.all([
        plotsApi.getPlots(),
        dronesApi.getRoutes(),
        dronesApi.getFlights(),
        dronesApi.getImages(),
      ]);
      if (request !== requestId) return;
      if (id === undefined) drones.value = response.data.map(DroneAssembler.toEntityFromResource);
      else selectedDrone.value = DroneAssembler.toEntityFromResource(response.data);
      [plots.value, routes.value, flights.value, images.value] = related.map((item) => item.data);
    } catch (failure) {
      if (request !== requestId) return;
      notFound.value = id !== undefined && failure.response?.status === 404;
      if (!notFound.value) error.value = 'drones.loadError';
    } finally {
      if (request === requestId) loading.value = false;
    }
  }


  async function mutate(action) {
    if (saving.value) return null;
    saving.value = true;
    error.value = '';
    try {
      return await action();
    } catch (failure) {
      error.value =
        failure.message === 'Duplicate serial' ? 'drones.duplicateSerial' : 'drones.saveError';
      return null;
    } finally {
      saving.value = false;
    }
  }


  function register(attributes) {
    return mutate(async () => {
      const existing = await dronesApi.getDrones();
      if (
        existing.data.some(
          (item) =>
            item.serialNumber?.trim().toLowerCase() ===
            attributes.serialNumber.trim().toLowerCase(),
        )
      )
        throw new Error('Duplicate serial');
      const entity = new Drone({
        ...attributes,
        status: 'DISCONNECTED',
        createdAt: new Date().toISOString(),
      });
      const response = await dronesApi.createDrone(DroneAssembler.toResourceFromEntity(entity));
      return DroneAssembler.toEntityFromResource(response.data);
    });
  }


  function setConnection(connected) {
    return mutate(async () => {
      const fresh = (await dronesApi.getDroneById(selectedDrone.value.id)).data;
      if (!['DISCONNECTED', 'AVAILABLE'].includes(fresh.status))
        throw new Error('Drone unavailable');
      const response = await dronesApi.patchDrone(fresh.id, {
        status: connected ? 'AVAILABLE' : 'DISCONNECTED',
      });
      selectedDrone.value = DroneAssembler.toEntityFromResource(response.data);
      return selectedDrone.value;
    });
  }


  function saveRoute(attributes, id) {
    return mutate(async () => {
      const route = new FlightRoute(attributes);
      const resource = {
        name: route.name,
        plotId: route.plotId,
        altitudeMeters: route.altitudeMeters,
        speedMetersPerSecond: route.speedMetersPerSecond,
        waypoints: route.waypoints,
      };
      const response = await dronesApi.saveRoute(resource, id);
      routes.value = [
        ...routes.value.filter((item) => String(item.id) !== String(response.data.id)),
        response.data,
      ];
      return response.data;
    });
  }


  function planFlight(routeId) {
    return mutate(async () => {
      const [droneResponse, routeResponse, flightResponse] = await Promise.all([
        dronesApi.getDroneById(selectedDrone.value.id),
        dronesApi.getRoutes(),
        dronesApi.getFlights(),
      ]);
      const drone = droneResponse.data,
        route = routeResponse.data.find((item) => String(item.id) === String(routeId));
      if (
        drone.status !== 'AVAILABLE' ||
        !route ||
        flightResponse.data.some(
          (item) =>
            String(item.droneId) === String(drone.id) &&
            ['PLANNED', 'IN_PROGRESS'].includes(item.status),
        )
      )
        throw new Error('Drone unavailable');
      const response = await dronesApi.createFlight({
        droneId: drone.id,
        flightRouteId: route.id,
        plotId: route.plotId,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
      });
      flights.value = [...flightResponse.data, response.data];
      return response.data;
    });
  }


  function cancelFlight(id) {
    return mutate(async () => {
      const fresh = (await dronesApi.getFlights()).data.find((item) => String(item.id) === String(id));
      if (
        !fresh ||
        String(fresh.droneId) !== String(selectedDrone.value.id) ||
        fresh.status !== 'PLANNED'
      )
        throw new Error('Flight unavailable');
      const response = await dronesApi.cancelFlight(id);
      flights.value = flights.value.map((item) =>
        String(item.id) === String(id) ? response.data : item,
      );
      return response.data;
    });
  }


  return {
    drones,
    selectedDrone,
    plots,
    routes,
    flights,
    images,
    loading,
    saving,
    error,
    notFound,
    load,
    register,
    setConnection,
    saveRoute,
    planFlight,
    cancelFlight,
  };
});
