
import axios from 'axios';
import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const cropsEndpointPath = import.meta.env.VITE_SKYCROP_CROPS_ENDPOINT_PATH;

export class CropsApi extends BaseApi{
    #cropsEndpoint;

    constructor() {
        super();
        this.#cropsEndpoint = new BaseEndpoint(this, cropsEndpointPath)
    }

    getCrops() {
        return this.#cropsEndpoint.getAll();
    }

    getCropById(id) {
        return this.#cropsEndpoint.getById(id);
    }

    createCrop(resource) {
        return this.#cropsEndpoint.create(resource);
    }

    updateCrop(id, resource) {
        return this.#cropsEndpoint.update(id, resource);
    }
}
