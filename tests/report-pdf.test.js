import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {jsPDF} from 'jspdf';
import {ReportAssembler} from '../src/reports/infrastructure/report.assembler.js';
import {downloadReportPdf} from '../src/reports/infrastructure/report-pdf.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/reports.json', import.meta.url)));

test('the real PDF exporter renders monitoring and seasonal value-object reports', async () => {
  const originalSave = jsPDF.API.save;
  const files = [];
  // Replace only the browser download boundary, leaving PDF layout and rendering real.
  jsPDF.API.save = function (filename) {
    files.push({filename, bytes: new Uint8Array(this.output('arraybuffer')), pages: this.getNumberOfPages()});
    return this;
  };
  try {
    for (const resource of [fixtures[0], fixtures.at(-1)])
      await downloadReportPdf(ReportAssembler.toEntityFromResource(resource), (key) => key, 'es-PE');
    assert.equal(files.length, 2);
    for (const file of files) {
      assert.match(file.filename, /^skycrop-report-[a-zA-Z0-9_-]+\.pdf$/);
      assert.equal(new TextDecoder().decode(file.bytes.slice(0, 4)), '%PDF');
      assert.ok(file.bytes.length > 1000);
      assert.ok(file.pages >= 1);
    }
  } finally {
    jsPDF.API.save = originalSave;
  }
});
