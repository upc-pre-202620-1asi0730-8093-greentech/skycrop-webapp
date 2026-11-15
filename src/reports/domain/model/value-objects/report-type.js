import {textValue} from './report-validation.js';

/** Immutable type code, normalized to the frontend's uppercase vocabulary. */
export class ReportType {
  /** @param {string} value @throws {TypeError|RangeError} For an unsupported code. */
  constructor(value) {
    this.value = textValue(value, 'ReportType', {optional: false}).toUpperCase();
    if (!['MONITORING', 'SEASONAL'].includes(this.value))
      throw new RangeError('Invalid ReportType');
    Object.freeze(this);
  }
  /** @param {unknown} other @returns {boolean} */
  equals(other) { return other instanceof ReportType && this.value === other.value; }
  /** @returns {string} Canonical API code. */
  toJSON() { return this.value; }
}
