import {measurement, objectValue} from './report-validation.js';

/**
 * Immutable report measurements. Missing readings remain null, including seasonal
 * area: adding repeated plot areas would overcount the monitored surface.
 */
export class ReportMetrics {
  /**
   * @param {{flights?: number|null, alerts?: number|null, averageNdvi?: number|null, areaHectares?: number|null}} data
   * @throws {TypeError|RangeError} For invalid counts, non-finite values or NDVI outside [-1,1].
   */
  constructor(data = {}) {
    objectValue(data, 'metrics');
    this.flights = measurement(data.flights, 'flights', {integer: true});
    this.alerts = measurement(data.alerts, 'alerts', {integer: true});
    this.averageNdvi = measurement(data.averageNdvi, 'averageNdvi', {min: -1, max: 1});
    this.areaHectares = measurement(data.areaHectares, 'areaHectares');
    Object.freeze(this);
  }
  /** @param {unknown} other @returns {boolean} Structural value equality. */
  equals(other) {
    return other instanceof ReportMetrics && ['flights', 'alerts', 'averageNdvi', 'areaHectares']
      .every((key) => this[key] === other[key]);
  }
  /** @returns {{flights: number|null, alerts: number|null, averageNdvi: number|null, areaHectares: number|null}} */
  toJSON() {
    return {flights: this.flights, alerts: this.alerts, averageNdvi: this.averageNdvi, areaHectares: this.areaHectares};
  }
}
