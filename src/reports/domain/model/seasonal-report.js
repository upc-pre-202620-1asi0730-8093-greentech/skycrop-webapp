import {Report} from './report.entity.js';
import {ReportPeriod} from './value-objects/report-period.js';
import {ReportSeason} from './value-objects/report-season.js';
import {ReportTitle} from './value-objects/report-title.js';
import {objectValue} from './value-objects/report-validation.js';
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
/** Return null if any source lacks the measurement; never fill gaps with zero. */
function sum(items, key) {
  return items.every((item) => finite(item[key]))
    ? items.reduce((total, item) => total + item[key], 0)
    : null;
}
/** Preserve the existing unweighted mean of source report measurements. */
function average(items, key) {
  const values = items.filter((item) => finite(item[key]));
  return values.length === items.length && values.length
    ? values.reduce((total, item) => total + item[key], 0) / values.length
    : null;
}
/**
 * Create a seasonal report from at least five distinct persisted monitoring reports.
 * Dates use inclusive UTC calendar-day boundaries. Source objects remain unchanged.
 * Area is intentionally unknown: summing repeated plot areas would double-count it.
 * @param {Report[]} reports Validated entities from the report assembler.
 * @param {{title: string, season: string, year: number|string, startDate: string, endDate: string}} attributes
 * @returns {Report} Unsaved entity retaining period boundaries and provenance.
 * @throws {Error} With 'Insufficient reports' when fewer than five sources qualify.
 * @throws {TypeError|RangeError} For invalid attributes or duplicate source identities.
 */
export function createSeasonalReport(reports, attributes) {
  objectValue(attributes, 'seasonal report attributes');
  if (!Array.isArray(reports) || reports.some((report) => !(report instanceof Report)))
    throw new TypeError('Seasonal sources must be Report entities');
  const title = new ReportTitle(attributes.title);
  const season = new ReportSeason(attributes.season);
  if (!['number', 'string'].includes(typeof attributes.year))
    throw new TypeError('Invalid report year');
  const year = Number(attributes.year);
  const period = new ReportPeriod(attributes.startDate, attributes.endDate);
  if (!season.value || !Number.isInteger(year) || year < 2000 || year > 2100)
    throw new RangeError('Invalid period');
  const sources = reports.filter((item) => item.type === 'MONITORING' && period.contains(item.generatedAt));
  if (sources.some((item) => item.id === null) ||
      new Set(sources.map((item) => String(item.id))).size !== sources.length)
    throw new RangeError('Seasonal sources require distinct persisted report IDs');
  if (sources.length < 5) throw new Error('Insufficient reports');
  const metrics = sources.map((item) => item.metrics);
  const grouped = new Map();
  sources.forEach((report) =>
    report.performance.forEach((row) => {
      const key = row.plotId ?? row.plotName;
      if (key === undefined) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    }),
  );
  const performance = [...grouped.values()].map((rows) => ({
    plotId: rows[0].plotId,
    plotName: rows[0].plotName,
    crops: [
      ...new Set(
        rows.flatMap((row) =>
          Array.isArray(row.crops) ? row.crops : row.crops ? [row.crops] : [],
        ),
      ),
    ],
    alerts: sum(rows, 'alerts'),
    flights: sum(rows, 'flights'),
    averageNdvi: average(rows, 'averageNdvi'),
  }));
  return new Report({
    title,
    season,
    year,
    startDate: period.startDate,
    endDate: period.endDate,
    type: 'SEASONAL',
    generatedAt: new Date().toISOString(),
    generatedBy: 'SkyCrop',
    sourceReportIds: sources.map((item) => item.id),
    metrics: {
      flights: sum(metrics, 'flights'),
      alerts: sum(metrics, 'alerts'),
      areaHectares: null,
      averageNdvi: average(metrics, 'averageNdvi'),
    },
    performance,
    ndviEvolution: sources
      .filter((item) => finite(item.metrics.averageNdvi))
      .map((item) => ({date: item.generatedAt, value: item.metrics.averageNdvi}))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  });
}
