import {BaseApi} from './base-api.js';

/** JSON collection transport. Keeps the configured mock API origin unchanged. */
export class CollectionApi extends BaseApi {
  async list(collection, params = {}) {
    const {data} = await this.http.get(`/${collection}`, {params});
    if (!Array.isArray(data)) throw new TypeError('Expected a collection resource.');
    return data;
  }
  async create(collection, resource) {
    return (await this.http.post(`/${collection}`, resource)).data;
  }
  async patch(collection, id, resource) {
    return (await this.http.patch(`/${collection}/${encodeURIComponent(id)}`, resource)).data;
  }
}
