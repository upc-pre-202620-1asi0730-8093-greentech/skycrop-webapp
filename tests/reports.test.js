import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Report} from '../src/reports/domain/model/report.entity.js';
import {ReportTitle} from '../src/reports/domain/model/value-objects/report-title.js';
import {ReportType} from '../src/reports/domain/model/value-objects/report-type.js';
import {ReportSeason} from '../src/reports/domain/model/value-objects/report-season.js';
import {ReportMetrics} from '../src/reports/domain/model/value-objects/report-metrics.js';
import {NdviEvolutionItem} from '../src/reports/domain/model/value-objects/ndvi-evolution-item.js';
import {ReportPerformanceItem} from '../src/reports/domain/model/value-objects/report-performance-item.js';
import {ReportPeriod} from '../src/reports/domain/model/value-objects/report-period.js';
import {ReportAssembler} from '../src/reports/infrastructure/report.assembler.js';
import {createSeasonalReport} from '../src/reports/domain/model/seasonal-report.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/reports.json', import.meta.url)));
const resource = () => structuredClone(fixtures[0]);
const sources = () => fixtures.map(ReportAssembler.toEntityFromResource);
const period = () => ({title: 'Season report', season: 'SUMMER', year: 2026, startDate: '2026-03-01', endDate: '2026-05-31'});

// These checks protect domain behavior and the existing view/API contract.
test('titles are trimmed, immutable values with case-sensitive equality', () => {
  const title = new ReportTitle('  Crop report  ');
  assert.equal(title.value, 'Crop report');
  assert.ok(title.equals(new ReportTitle('Crop report')));
  assert.equal(title.equals(new ReportTitle('crop report')), false);
  assert.throws(() => { title.value = 'Changed'; }, TypeError);
});
for (const value of ['', ' ', 5, null, {}, []]) {
  test(`invalid title is rejected: ${JSON.stringify(value)}`, () => assert.throws(() => new ReportTitle(value)));
}

test('counts cannot be negative, fractional, infinite, strings or unsafe integers', () => {
  for (const field of ['flights', 'alerts'])
    for (const value of [-1, 0.5, Infinity, NaN, '2', Number.MAX_SAFE_INTEGER + 1])
      assert.throws(() => new ReportMetrics({[field]: value}));
});
test('unknown metrics remain null and measured zero remains zero', () => {
  assert.deepEqual(new ReportMetrics().toJSON(), {flights: null, alerts: null, averageNdvi: null, areaHectares: null});
  assert.deepEqual(new ReportMetrics({flights: 0, alerts: 0, averageNdvi: 0, areaHectares: 0}).toJSON(),
    {flights: 0, alerts: 0, averageNdvi: 0, areaHectares: 0});
});
test('NDVI is finite and within [-1,1]; area cannot be negative', () => {
  for (const value of [-1.01, 1.01, NaN, Infinity, '0.8'])
    assert.throws(() => new ReportMetrics({averageNdvi: value}));
  assert.equal(new ReportMetrics({averageNdvi: -1}).averageNdvi, -1);
  assert.equal(new ReportMetrics({averageNdvi: 1}).averageNdvi, 1);
  assert.throws(() => new ReportMetrics({areaHectares: -1}));
});
test('metrics use structural equality and expose fresh JSON data', () => {
  const metrics = new ReportMetrics({flights: 3});
  assert.ok(metrics.equals(new ReportMetrics({flights: 3})));
  assert.equal(metrics.equals(new ReportMetrics({flights: 4})), false);
  metrics.toJSON().flights = 999;
  assert.equal(metrics.flights, 3);
});
test('an NDVI observation requires a real date and a measured value', () => {
  for (const data of [{date: '2026-02-30', value: 0.3}, {date: 'invalid', value: 0.3},
    {date: '2026-03-01', value: null}, {date: '2026-03-01', value: 2}])
    assert.throws(() => new NdviEvolutionItem(data));
  const a = new NdviEvolutionItem({date: '2026-03-01T01:00:00+01:00', value: 0.3});
  assert.ok(a.equals(new NdviEvolutionItem({date: '2026-03-01', value: 0.3})));
});
test('performance isolates crop lists at input, getter and JSON boundaries', () => {
  const data = structuredClone(fixtures[0].performance[0]);
  const row = new ReportPerformanceItem(data);
  data.crops.push('External');
  row.crops.push('External getter');
  row.toJSON().crops.push('External JSON');
  assert.deepEqual(row.crops, fixtures[0].performance[0].crops);
  assert.ok(row.equals(new ReportPerformanceItem(fixtures[0].performance[0])));
});
test('legacy string crops are normalized to a list without splitting crop names', () => {
  const row = new ReportPerformanceItem({plotName: 'North', crops: 'Maize, variety A'});
  assert.deepEqual(row.crops, ['Maize, variety A']);
});
test('performance requires a plot identity and valid nested values', () => {
  for (const data of [{}, {plotId: 0}, {plotId: 1, crops: [null]}, {plotId: 1, crops: {}},
    {plotId: 1, flights: -1}, {plotId: 1, averageNdvi: 2}])
    assert.throws(() => new ReportPerformanceItem(data));
});
test('UTC periods include the entire final day and handle leap days', () => {
  const selected = new ReportPeriod('2024-02-29', '2024-03-01');
  assert.ok(selected.contains('2024-02-29T00:00:00Z'));
  assert.ok(selected.contains('2024-03-01T23:59:59.999Z'));
  assert.equal(selected.contains('2024-03-02T00:00:00Z'), false);
  assert.equal(selected.contains('2024-02-28T23:59:59Z'), false);
  assert.ok(selected.equals(new ReportPeriod('2024-02-29', '2024-03-01')));
});
test('periods reject calendar overflow, malformed dates and reversed boundaries', () => {
  for (const [start, end] of [['2026-02-29', '2026-03-01'], ['2026-04-31', '2026-05-01'],
    ['2026-03-02', '2026-03-01'], ['2026-3-01', '2026-03-10']])
    assert.throws(() => new ReportPeriod(start, end));
});
test('type and season use the same uppercase codes as the existing UI', () => {
  assert.equal(new ReportType('Monitoring').value, 'MONITORING');
  assert.equal(new ReportSeason('Summer').value, 'SUMMER');
  assert.throws(() => new ReportType('unknown'));
  assert.throws(() => new ReportType(0));
  assert.throws(() => new ReportSeason('unknown'));
});
test('all six existing fake-API reports remain usable by views and exporters', () => {
  for (const data of fixtures) {
    const report = ReportAssembler.toEntityFromResource(data);
    assert.equal(report.id, data.id);
    assert.equal(report.title, data.title.trim());
    assert.equal(report.type, data.type);
    assert.deepEqual(report.metrics, data.metrics);
    assert.equal(report.ndviEvolution.length, data.ndviEvolution.length);
    assert.equal(report.performance.length, data.performance.length);
    assert.ok(Number.isFinite(Date.parse(report.generatedAt)));
  }
});
test('constructor inputs cannot later mutate report metrics, crops or observations', () => {
  const data = resource(), report = new Report(data);
  data.metrics.flights = 999;
  data.performance[0].crops.push('External');
  data.ndviEvolution[0].value = -1;
  assert.equal(report.metrics.flights, fixtures[0].metrics.flights);
  assert.deepEqual(report.performance[0].crops, fixtures[0].performance[0].crops);
  assert.equal(report.ndviEvolution[0].value, fixtures[0].ndviEvolution[0].value);
});
test('getter results cannot mutate any nested report collection', () => {
  const report = new Report(resource());
  report.metrics.flights = 999;
  report.performance[0].crops.push('External');
  report.performance.pop();
  report.ndviEvolution[0].value = -1;
  report.sourceReportIds.push('spoof');
  assert.equal(report.metrics.flights, fixtures[0].metrics.flights);
  assert.deepEqual(report.performance[0].crops, fixtures[0].performance[0].crops);
  assert.equal(report.performance.length, fixtures[0].performance.length);
  assert.equal(report.ndviEvolution[0].value, fixtures[0].ndviEvolution[0].value);
  assert.deepEqual(report.sourceReportIds, []);
});
test('an invalid timestamp or year cannot be normalized into a valid report', () => {
  for (const generatedAt of [null, 0, '2026-02-30T00:00:00Z', '2026-03-01T24:00:00Z', '2026-03-01T12:00:00'])
    assert.throws(() => new Report({...resource(), generatedAt}));
  for (const year of [0, 1.5, '2026', NaN]) assert.throws(() => new Report({...resource(), year}));
});
test('the default year uses UTC independently of the host time zone', () => {
  const report = new Report({...resource(), year: undefined, generatedAt: '2025-12-31T23:30:00-05:00'});
  assert.equal(report.year, 2026);
});
test('seasonal reports require a season; partial periods and duplicate sources are rejected', () => {
  assert.throws(() => new Report({...resource(), type: 'SEASONAL', season: ''}));
  assert.throws(() => new Report({...resource(), startDate: '2026-01-01'}));
  assert.throws(() => new Report({...resource(), sourceReportIds: [1, '1']}));
});
test('assembler retains period and provenance without exposing domain objects or assigning an ID', () => {
  const report = new Report({...resource(), startDate: '2026-01-01', endDate: '2026-03-31', sourceReportIds: ['rep_002']});
  const payload = ReportAssembler.toResourceFromEntity(report);
  assert.equal(payload.id, undefined);
  assert.equal(payload.startDate, '2026-01-01');
  assert.equal(payload.endDate, '2026-03-31');
  const restored = ReportAssembler.toEntityFromResource({id: report.id, ...JSON.parse(JSON.stringify(payload))});
  assert.deepEqual(ReportAssembler.toResourceFromEntity(restored), payload);
  payload.performance[0].crops.push('External payload');
  assert.deepEqual(restored.performance[0].crops, fixtures[0].performance[0].crops);
});
test('seasonal generation aggregates five monitoring sources and preserves unknown area', () => {
  const original = sources();
  const before = JSON.stringify(original.map(ReportAssembler.toResourceFromEntity));
  const report = createSeasonalReport(original, period());
  assert.equal(report.type, 'SEASONAL');
  assert.equal(report.id, null);
  assert.equal(report.metrics.flights, 25);
  assert.equal(report.metrics.alerts, 7);
  assert.equal(report.metrics.areaHectares, null);
  assert.equal(report.metrics.averageNdvi, 0.742);
  assert.equal(report.sourceReportIds.length, 5);
  assert.equal(report.startDate, period().startDate);
  assert.equal(report.endDate, period().endDate);
  assert.equal(JSON.stringify(original.map(ReportAssembler.toResourceFromEntity)), before);
});
test('seasonal generation keeps the UI insufficient-reports error', () => {
  assert.throws(() => createSeasonalReport(sources().slice(0, 4), period()), {message: 'Insufficient reports'});
});
test('duplicate persisted source identities cannot satisfy the seasonal minimum', () => {
  assert.throws(() => createSeasonalReport(Array(5).fill(sources()[0]), period()), /distinct persisted/);
});
test('seasonal aggregation does not fabricate values missing from one source', () => {
  const reports = fixtures.slice(0, 5).map((data, index) => new Report(index === 0 ?
    {...structuredClone(data), metrics: {...data.metrics, flights: null, averageNdvi: null}} : data));
  const report = createSeasonalReport(reports, period());
  assert.equal(report.metrics.flights, null);
  assert.equal(report.metrics.averageNdvi, null);
  assert.equal(report.ndviEvolution.length, 4);
});
test('seasonal input rejects malformed periods, unsupported years and raw response objects', () => {
  assert.throws(() => createSeasonalReport(sources(), {...period(), startDate: '2026-02-30'}));
  assert.throws(() => createSeasonalReport(sources(), {...period(), year: 2101}));
  assert.throws(() => createSeasonalReport(sources(), {...period(), year: [2026]}));
  assert.throws(() => createSeasonalReport(fixtures, period()));
});
