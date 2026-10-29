
import axios from 'axios';

export class CropsApi {
    #http;

    constructor(baseURL = import.meta.env.VITE_SKYCROP_API_URL) {
        this.#http = axios.create({baseURL});
    }

    getCrops() {
        return this.#http.get('/crops');
    }

    getById(id) {
        return this.#http.get(`/crops/${encodeURIComponent(id)}`);
    }

    create(resource) {
        return this.#http.post('/crops', resource);
    }

    update(id, resource) {
        return this.#http.put(`/crops/${encodeURIComponent(id)}`, resource);
    }
}
