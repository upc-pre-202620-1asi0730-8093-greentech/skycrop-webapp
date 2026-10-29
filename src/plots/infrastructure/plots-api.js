import axios from 'axios';
import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const plotsEndpoint = import.meta.env.VITE_SKYCROP_PLOTS_ENDPOINT_PATH;
const platformUrl = import.meta.env.VITE_SKYCROP_API_URL;

export class PlotsApi extends BaseApi {
  #plotsEndpoint;

  constructor() {
    super();
    this.#plotsEndpoint = new BaseEndpoint(this, plotsEndpoint);
  }

  getPlots() {
    return this.#plotsEndpoint.getAll();
  }

  getPlotById(id) {
    return this.#plotsEndpoint.getById(id);
  }

  createPlot(resource) {
    return this.#plotsEndpoint.create(resource);
  }


  //TODO: Implement notifications bounded context, then delete this method
  getNotifications() {
    return axios.create({baseURL: platformUrl}).get('/notifications');

  }


}
