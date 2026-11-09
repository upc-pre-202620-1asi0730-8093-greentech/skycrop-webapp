import {measurement, objectValue, timestamp} from './report-validation.js';

/** Immutable NDVI observation, identified by its date and measured value rather than an ID. */
export class NdviEvolutionItem {
  #date;
  /** @param {{date: string, value: number}} data @throws {TypeError|RangeError} */
  constructor(data) {
    objectValue(data, 'NDVI observation');
    this.#date = timestamp(data.date, 'NDVI observation date', {allowDateOnly: true});
    this.value = measurement(data.value, 'NDVI observation', {min: -1, max: 1});
    if (this.value === null) throw new TypeError('An NDVI observation requires a measured value');
    Object.freeze(this);
  }
  /** @returns {string} UTC timestamp at JavaScript millisecond precision. */
  get date() { return this.#date.toISOString(); }
  /** @param {unknown} other @returns {boolean} */
  equals(other) { return other instanceof NdviEvolutionItem && this.date === other.date && this.value === other.value; }
  /** @returns {{date: string, value: number}} */
  toJSON() { return {date: this.date, value: this.value}; }
}
