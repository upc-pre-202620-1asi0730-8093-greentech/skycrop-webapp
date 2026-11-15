import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const reportsEndpoint = import.meta.env.VITE_SKYCROP_REPORTS_ENDPOINT_PATH;

/** Reports transport using the configured shared API base URL and collection path. */
export class ReportsApi extends BaseApi {
  #reportsEndpoint;

  constructor() {
    super();
    this.#reportsEndpoint = new BaseEndpoint(this, reportsEndpoint);
  }

  /** @returns {Promise<import('axios').AxiosResponse<object[]>>} Raw resources for the assembler. */
  getReports() {
    return this.#reportsEndpoint.getAll();
  }
  /** @param {string|number} id @returns {Promise<import('axios').AxiosResponse<object>>} */
  getReportById(id) {
    return this.#reportsEndpoint.getById(id);
  }
  /**
   * @param {object} resource Primitive payload produced by ReportAssembler.
   * @returns {Promise<import('axios').AxiosResponse<object>>} Persisted resource with its ID.
   */
  createReport(resource) {
    return this.#reportsEndpoint.create(resource);
  }
}
