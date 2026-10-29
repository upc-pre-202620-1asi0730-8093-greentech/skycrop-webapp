import axios from 'axios';
import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const dronesEndpoint = import.meta.env.VITE_SKYCROP_DRONES_ENDPOINT_PATH;
const routesEndpoint = import.meta.env.VITE_SKYCROP_FLIGHT_ROUTES_ENDPOINT_PATH;
const flightsEndpoint = import.meta.env.VITE_SKYCROP_FLIGHTS_ENDPOINT_PATH;
const imagesEndpoint = import.meta.env.VITE_SKYCROP_AERIAL_IMAGES_ENDPOINT_PATH;

export class DronesApi extends BaseApi {
  #dronesEndpoint;
  #routesEndpoint;
  #flightsEndpoint;
  #imagesEndpoint;

  constructor() {
    super();
    this.#dronesEndpoint = new BaseEndpoint(this, dronesEndpoint);
    this.#routesEndpoint = new BaseEndpoint(this, routesEndpoint);
    this.#imagesEndpoint = new BaseEndpoint(this, imagesEndpoint);
    this.#flightsEndpoint = new BaseEndpoint(this, flightsEndpoint);
  }
  getDrones() {
    return this.#dronesEndpoint.getAll();
  }
  getDroneById(id) {
    return this.#dronesEndpoint.getById(id);
  }
  createDrone(resource) {
    return this.#dronesEndpoint.create(resource);
  }
  patchDrone(id, resource) {
    return this.#dronesEndpoint.patch(id, resource);
  }

  getRoutes() {
    return this.#routesEndpoint.getAll();
  }
  getFlights() {
    return this.#flightsEndpoint.getAll();
  }
  getImages() {
    return this.#imagesEndpoint.getAll();
  }
  saveRoute(resource, id) {
    return id === undefined
      ? this.#routesEndpoint.create(resource)
      : this.#routesEndpoint.patch(id, resource);
  }
  createFlight(resource) {
    return this.#flightsEndpoint.create(resource);
  }
  cancelFlight(id) {
    return this.#flightsEndpoint.patch(id, {status: 'CANCELLED'});
  }
}
