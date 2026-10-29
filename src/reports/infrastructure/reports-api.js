import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const reportsEndpoint = import.meta.env.VITE_SKYCROP_REPORTS_ENDPOINT_PATH;

export class ReportsApi extends BaseApi {
  #reportsEndpoint;

  constructor() {
    super();
    this.#reportsEndpoint = new BaseEndpoint(this, reportsEndpoint);
  }

  getReports() {
    return this.#reportsEndpoint.getAll();
  }
  getReportById(id) {
    return this.#reportsEndpoint.getById(id);
  }
  createReport(resource) {
    return this.#reportsEndpoint.create(resource);
  }
}
