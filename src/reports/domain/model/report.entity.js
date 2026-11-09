import {ReportTitle} from './value-objects/report-title.js';
import {ReportType} from './value-objects/report-type.js';
import {ReportSeason} from './value-objects/report-season.js';
import {ReportMetrics} from './value-objects/report-metrics.js';
import {NdviEvolutionItem} from './value-objects/ndvi-evolution-item.js';
import {ReportPerformanceItem} from './value-objects/report-performance-item.js';
import {ReportPeriod} from './value-objects/report-period.js';
import {identifier, objectValue, textValue, timestamp} from './value-objects/report-validation.js';

/**
 * Report entity with validated, immutable value objects and an optional persisted ID.
 * Public getters preserve the primitive shapes consumed by Vue views, charts and PDF
 * export. Neither constructor inputs nor getter results can mutate the entity.
 * The fake API's unavailable measurements remain null rather than fabricated zeros.
 */
export class Report {
  #id;
  #title;
  #generatedAt;
  #season;
  #year;
  #owner;
  #generatedBy;
  #type;
  #content;
  #metrics;
  #ndviEvolution;
  #performance;
  #sourceReportIds;
  #period;

  /**
   * @param {object} data Domain attributes supplied by the resource assembler or factory.
   * @param {string|number|null} [data.id] Null until the API assigns an identifier.
   * @param {string|ReportTitle} data.title
   * @param {string} data.generatedAt ISO timestamp with an explicit time-zone offset.
   * @param {string} [data.type='MONITORING']
   * @param {string} [data.season=''] Required for seasonal reports.
   * @param {number} [data.year] Defaults to the generation timestamp's UTC year.
   * @param {string} [data.owner=''] Optional legacy ownership label.
   * @param {string} [data.generatedBy=''] Optional generator attribution.
   * @param {string} [data.content=''] Text body preserving its formatting.
   * @param {object|ReportMetrics} [data.metrics]
   * @param {object[]} [data.ndviEvolution=[]]
   * @param {object[]} [data.performance=[]]
   * @param {(string|number)[]} [data.sourceReportIds=[]] Unique persisted source IDs.
   * @param {string} [data.startDate] Both period boundaries must be supplied together.
   * @param {string} [data.endDate]
   * @throws {TypeError|RangeError} When any domain attribute is invalid.
   */
  constructor(data) {
    objectValue(data, 'report');
    this.#id = identifier(data.id, 'report id', {optional: true});
    this.#title = data.title instanceof ReportTitle ? data.title : new ReportTitle(data.title);
    this.#generatedAt = timestamp(data.generatedAt, 'report generation date');
    this.#type = data.type instanceof ReportType ? data.type : new ReportType(data.type ?? 'MONITORING');
    this.#season = data.season instanceof ReportSeason ? data.season : new ReportSeason(data.season);
    if (this.#type.value === 'SEASONAL' && !this.#season.value)
      throw new RangeError('A seasonal report requires a season');
    this.#year = data.year ?? this.#generatedAt.toDate().getUTCFullYear();
    if (!Number.isInteger(this.#year) || this.#year < 1 || this.#year > 9999)
      throw new RangeError('Invalid report year');
    this.#owner = textValue(data.owner, 'report owner', {optional: true});
    this.#generatedBy = textValue(data.generatedBy, 'report generator', {optional: true});
    if (data.content != null && typeof data.content !== 'string')
      throw new TypeError('Report content must be text');
    this.#content = data.content ?? '';
    this.#metrics = data.metrics instanceof ReportMetrics ? data.metrics : new ReportMetrics(data.metrics ?? {});
    this.#ndviEvolution = this.#values(data.ndviEvolution ?? [], NdviEvolutionItem, 'NDVI evolution');
    this.#performance = this.#values(data.performance ?? [], ReportPerformanceItem, 'performance');
    if (!Array.isArray(data.sourceReportIds ?? [])) throw new TypeError('Source report IDs must be an array');
    const ids = (data.sourceReportIds ?? []).map((id) => identifier(id, 'source report id'));
    if (new Set(ids.map(String)).size !== ids.length) throw new RangeError('Duplicate source report IDs');
    this.#sourceReportIds = Object.freeze(ids);
    this.#period = data.startDate == null && data.endDate == null ? null :
      new ReportPeriod(data.startDate, data.endDate);
    Object.freeze(this);
  }

  #values(items, ValueType, field) {
    if (!Array.isArray(items)) throw new TypeError(`${field} must be an array`);
    return Object.freeze(items.map((item) => item instanceof ValueType ? item : new ValueType(item)));
  }

  /** @returns {string|number|null} Stable identity, or null for an unsaved report. */
  get id() { return this.#id; }
  /** @returns {string} Trimmed display title. */
  get title() { return this.#title.value; }
  /** @returns {string} Canonical UTC timestamp. */
  get generatedAt() { return this.#generatedAt.toISOString(); }
  /** @returns {string} Uppercase season code or an empty value for legacy monitoring data. */
  get season() { return this.#season.value; }
  /** @returns {number} Selected reporting year. */
  get year() { return this.#year; }
  /** @returns {string} Empty when ownership is unavailable in the current fake API. */
  get owner() { return this.#owner; }
  /** @returns {string} Stored generator attribution; no drone identity is inferred. */
  get generatedBy() { return this.#generatedBy; }
  /** @returns {string} MONITORING or SEASONAL. */
  get type() { return this.#type.value; }
  /** @returns {string} Report body, preserving its formatting. */
  get content() { return this.#content; }
  /** @returns {object} Fresh metrics resource with number or null values. */
  get metrics() { return this.#metrics.toJSON(); }
  /** @returns {{date: string, value: number}[]} Defensive observation resources. */
  get ndviEvolution() { return this.#ndviEvolution.map((item) => item.toJSON()); }
  /** @returns {object[]} Defensive performance resources, including isolated crop arrays. */
  get performance() { return this.#performance.map((item) => item.toJSON()); }
  /** @returns {(string|number)[]} Copy of the source report identifiers. */
  get sourceReportIds() { return [...this.#sourceReportIds]; }
  /** @returns {string|null} Inclusive start date, if the historical resource supplies it. */
  get startDate() { return this.#period?.startDate ?? null; }
  /** @returns {string|null} Inclusive final date, if the historical resource supplies it. */
  get endDate() { return this.#period?.endDate ?? null; }
}
