import axios from 'axios';
import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const diagnosesEndpoint = import.meta.env.VITE_SKYCROP_DIAGNOSES_ENDPOINT_PATH

export class DiagnosesApi extends BaseApi {
  #diagnosesEndpoint;

  constructor() {
    super();
    this.#diagnosesEndpoint = new BaseEndpoint(this, diagnosesEndpoint);
  }

  getDiagnoses() {
    return this.#diagnosesEndpoint.getAll();
  }

  getDiagnosticById(id) {
    return this.#diagnosesEndpoint.getById(id);
  }


  createDiagnostic(resource) {
    return this.#diagnosesEndpoint.create(resource);
  }
}
