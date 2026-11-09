import {textValue} from './report-validation.js';

/** Immutable report title; equality compares trimmed text and preserves case. */
export class ReportTitle {
  /** @param {string} value Non-empty display title. @throws {TypeError} */
  constructor(value) {
    this.value = textValue(value, 'report title');
    Object.freeze(this);
  }
  /** @param {unknown} other @returns {boolean} */
  equals(other) { return other instanceof ReportTitle && this.value === other.value; }
  /** @returns {string} Primitive value for the API and presentation. */
  toJSON() { return this.value; }
}
