import {Report} from '../domain/model/report.entity.js';
import {objectValue} from '../domain/model/value-objects/report-validation.js';

/** Maps the current reports JSON contract to validated domain entities and back. */
export class ReportAssembler {
  /**
   * @param {object} resource Current fake-API report resource.
   * @returns {Report} An entity isolated from mutable response objects.
   * @throws {TypeError|RangeError} When the payload violates the domain contract.
   */
  static toEntityFromResource(resource) {
    objectValue(resource, 'report resource');
    return new Report({
      id: resource.id,
      title: resource.title,
      generatedAt: resource.generatedAt,
      season: resource.season,
      year: resource.year,
      owner: resource.owner,
      generatedBy: resource.generatedBy,
      type: resource.type,
      content: resource.content,
      metrics: resource.metrics,
      ndviEvolution: resource.ndviEvolution,
      performance: resource.performance,
      sourceReportIds: resource.sourceReportIds,
      startDate: resource.startDate,
      endDate: resource.endDate,
    });
  }

  /**
   * @param {Report} entity Report to persist through POST /reports.
   * @returns {object} Primitive JSON data; ID assignment belongs to the API.
   * Unknown measurements remain null. A known reporting period is retained.
   */
  static toResourceFromEntity(entity) {
    if (!(entity instanceof Report)) throw new TypeError('A Report entity is required');
    return {
      title: entity.title,
      generatedAt: entity.generatedAt,
      season: entity.season,
      year: entity.year,
      owner: entity.owner,
      generatedBy: entity.generatedBy,
      type: entity.type,
      content: entity.content,
      metrics: entity.metrics,
      ndviEvolution: entity.ndviEvolution,
      performance: entity.performance,
      sourceReportIds: entity.sourceReportIds,
      ...(entity.startDate === null ? {} : {startDate: entity.startDate, endDate: entity.endDate}),
    };
  }
}
