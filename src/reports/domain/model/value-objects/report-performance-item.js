import {identifier, objectValue, textValue} from './report-validation.js';
import {ReportMetrics} from './report-metrics.js';

/** Immutable per-plot performance, including an isolated collection of crop names. */
export class ReportPerformanceItem {
  #crops;
  #metrics;
  /**
   * @param {{plotId?: string|number, plotName?: string, crops?: string[]|string, alerts?: number|null, flights?: number|null, averageNdvi?: number|null}} data
   * @throws {TypeError|RangeError} When plot identity, crop names or measurements are invalid.
   */
  constructor(data) {
    objectValue(data, 'report performance');
    this.plotId = identifier(data.plotId, 'performance plotId', {optional: true});
    this.plotName = textValue(data.plotName, 'performance plotName', {optional: true});
    if (this.plotId === null && !this.plotName) throw new TypeError('Performance requires a plot ID or name');
    const crops = data.crops == null || data.crops === '' ? [] :
      typeof data.crops === 'string' ? [data.crops] : data.crops;
    if (!Array.isArray(crops)) throw new TypeError('Crops must be a list of names');
    this.#crops = Object.freeze(crops.map((crop) => textValue(crop, 'crop name')));
    this.#metrics = new ReportMetrics({flights: data.flights, alerts: data.alerts, averageNdvi: data.averageNdvi});
    Object.freeze(this);
  }
  /** @returns {string[]} A defensive copy, including when accessed through Report. */
  get crops() { return [...this.#crops]; }
  /** @returns {number|null} */
  get flights() { return this.#metrics.flights; }
  /** @returns {number|null} */
  get alerts() { return this.#metrics.alerts; }
  /** @returns {number|null} */
  get averageNdvi() { return this.#metrics.averageNdvi; }
  /** @param {unknown} other @returns {boolean} Crop order participates in equality. */
  equals(other) {
    return other instanceof ReportPerformanceItem && this.plotId === other.plotId &&
      this.plotName === other.plotName && this.#metrics.equals(other.#metrics) &&
      this.#crops.length === other.#crops.length && this.#crops.every((crop, i) => crop === other.#crops[i]);
  }
  /** @returns {{plotId: string|number|null, plotName: string, crops: string[], alerts: number|null, flights: number|null, averageNdvi: number|null}} */
  toJSON() {
    return {plotId: this.plotId, plotName: this.plotName, crops: this.crops,
      alerts: this.alerts, flights: this.flights, averageNdvi: this.averageNdvi};
  }
}
