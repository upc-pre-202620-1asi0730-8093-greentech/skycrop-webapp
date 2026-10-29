import axios from 'axios';

export class PlotsApi {
  #http;

  constructor(baseURL = import.meta.env.VITE_SKYCROP_API_URL) {
    this.#http = axios.create({baseURL});
  }

  getPlots() {
    return this.#http.get('/plots');
  }

  getPlotById(id) {
    return this.#http.get(`/plots/${encodeURIComponent(id)}`);
  }

  getCrops() { return this.#http.get('/crops'); }

  getNotifications() { return this.#http.get('/notifications'); }

  getDiagnoses() { return this.#http.get('/diagnoses'); }

  create(resource) {
    return this.#http.post('/plots', resource);
  }
}
