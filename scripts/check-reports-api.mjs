import {loadEnv} from 'vite';
import {ReportAssembler} from '../src/reports/infrastructure/report.assembler.js';

/** Read-only contract smoke check against the configured published mock API. */
async function checkReportsApi() {
  const mode = process.argv[2] ?? 'development';
  const env = {...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env};
  const base = env.VITE_SKYCROP_API_URL;
  const endpoint = env.VITE_SKYCROP_REPORTS_ENDPOINT_PATH;
  if (!base || !endpoint) throw new Error('The reports API configuration is incomplete');
  const url = `${base.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const response = await fetch(url, {signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error(`The reports collection returned HTTP ${response.status}`);
  const resources = await response.json();
  if (!Array.isArray(resources)) throw new TypeError('The reports collection must return an array');
  resources.forEach((resource, index) => {
    try { ReportAssembler.toEntityFromResource(resource); }
    catch (error) { throw new Error(`Invalid report at resource index ${index}: ${error.message}`); }
  });
  console.log(`Reports API: HTTP ${response.status}; ${resources.length} validated resources; mode ${mode}.`);
  console.log('Only GET was sent. Remote records were not modified.');
}

checkReportsApi().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
