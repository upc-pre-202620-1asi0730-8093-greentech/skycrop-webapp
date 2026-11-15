import {textValue} from './report-validation.js';

/** Immutable season code, normalized to the frontend's uppercase vocabulary. */
export class ReportSeason {
  /** @param {string} value @throws {TypeError|RangeError} For an unsupported code. */
  constructor(value) {
    this.value = textValue(value, 'ReportSeason', {optional: true}).toUpperCase();
    if (this.value && !['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].includes(this.value))
      throw new RangeError('Invalid ReportSeason');
    Object.freeze(this);
  }
  /** @param {unknown} other @returns {boolean} */
  equals(other) { return other instanceof ReportSeason && this.value === other.value; }
  /** @returns {string} Canonical API code. */
  toJSON() { return this.value; }
}
