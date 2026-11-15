/**
 * Render a validated report with its metrics, NDVI chart and per-plot performance.
 * Missing readings use the existing unavailable label. jsPDF is loaded only when
 * an export is requested; report getters provide isolated primitive resources.
 * @param {import('../domain/model/report.entity.js').Report} report
 * @param {(key: string) => string} t Translation lookup for the current UI language.
 * @param {string} locale Locale used to format dates and numbers.
 * @returns {Promise<void>} Resolves after the PDF download has been requested.
 * @throws {Error} When PDF loading, rendering or download fails.
 */
export async function downloadReportPdf(report, t, locale) {
  const {jsPDF} = await import('jspdf');
  const doc = new jsPDF();
  doc.setProperties({title: report.title, author: 'GreenTech', subject: 'SkyCrop'});
  let y = 20;
  const text = (value, size = 11) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(
      String(value).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ''),
      170,
    );
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += size === 18 ? 9 : 6;
    }
    y += 3;
  };
  const number = (value) =>
    typeof value === 'number' && Number.isFinite(value)
      ? new Intl.NumberFormat(locale, {maximumFractionDigits: 3}).format(value)
      : t('reports.unavailable');
  text('SkyCrop', 18);
  text(report.title, 18);
  text(`ID: ${report.id}`);
  text(
    `${t('reports.date')}: ${new Intl.DateTimeFormat(locale, {dateStyle: 'short', timeStyle: 'short'}).format(new Date(report.generatedAt))}`,
  );
  text(
    `${t('reports.season')}: ${report.year} ${report.season ? t(`reports.${report.season}`) : t('reports.unavailable')}`,
  );
  text(`${t('reports.owner')}: ${report.owner || t('reports.unavailable')}`);
  text(`${t('reports.generatedBy')}: ${report.generatedBy || t('reports.unavailable')}`);
  for (const key of ['flights', 'areaHectares', 'alerts', 'averageNdvi'])
    text(`${t(`reports.${key}`)}: ${number(report.metrics[key])}`);
  text(t('reports.evolution'), 18);
  const points = report.ndviEvolution
    .filter(
      (point) =>
        Number.isFinite(point.value) &&
        point.value >= -1 &&
        point.value <= 1 &&
        Number.isFinite(Date.parse(point.date)),
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!points.length) text(t('reports.noNdvi'));
  else {
    if (y > 190) {
      doc.addPage();
      y = 20;
    }
    const start = y;
    doc.setDrawColor(57, 142, 175);
    doc.line(25, start, 25, start + 60);
    doc.line(25, start + 60, 185, start + 60);
    const firstDate = Date.parse(points[0].date);
    const lastDate = Date.parse(points.at(-1).date);
    const coordinates = points.map((point) => ({
      x:
        firstDate === lastDate
          ? 105
          : 25 + ((Date.parse(point.date) - firstDate) / (lastDate - firstDate)) * 160,
      y: start + 60 - (point.value + 1) * 30,
    }));
    coordinates.forEach((point, index) => {
      doc.circle(point.x, point.y, 1, 'F');
      if (index) doc.line(coordinates[index - 1].x, coordinates[index - 1].y, point.x, point.y);
    });
    y += 70;
    points.forEach((point) =>
      text(
        `${new Intl.DateTimeFormat(locale, {dateStyle: 'short'}).format(new Date(point.date))}: ${number(point.value)}`,
      ),
    );
  }
  text(t('reports.performance'), 18);
  if (!report.performance.length) text(t('reports.noPerformance'));
  report.performance.forEach((row) => {
    text(row.plotName || `#${row.plotId}`);
    text(
      `${t('reports.crops')}: ${Array.isArray(row.crops) ? row.crops.join(', ') : row.crops || t('reports.unavailable')}`,
    );
    text(
      `${t('reports.alerts')}: ${number(row.alerts)} | ${t('reports.flights')}: ${number(row.flights)} | NDVI: ${number(row.averageNdvi)}`,
    );
  });
  if (report.content) text(report.content);
  doc.save(`skycrop-report-${String(report.id).replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`);
}
