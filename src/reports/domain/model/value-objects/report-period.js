import {calendarDate, timestamp} from './report-validation.js';

/** Inclusive UTC calendar-date period selected for a seasonal report. */
export class ReportPeriod {
  #start;
  #endExclusive;
  /** @param {string} startDate @param {string} endDate @throws {TypeError|RangeError} */
  constructor(startDate, endDate) {
    this.startDate = calendarDate(startDate, 'period startDate');
    this.endDate = calendarDate(endDate, 'period endDate');
    this.#start = Date.parse(`${this.startDate}T00:00:00Z`);
    this.#endExclusive = Date.parse(`${this.endDate}T00:00:00Z`) + 86400000;
    if (this.startDate > this.endDate) throw new RangeError('Invalid period');
    Object.freeze(this);
  }
  /** @param {string} instant @returns {boolean} Includes the complete final UTC day. */
  contains(instant) {
    const value = timestamp(instant, 'period observation').valueOf();
    return value >= this.#start && value < this.#endExclusive;
  }
  /** @param {unknown} other @returns {boolean} */
  equals(other) { return other instanceof ReportPeriod && this.startDate === other.startDate && this.endDate === other.endDate; }
  /** @returns {{startDate: string, endDate: string}} */
  toJSON() { return {startDate: this.startDate, endDate: this.endDate}; }
}
