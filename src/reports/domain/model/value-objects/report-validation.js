import {DateTime} from '../../../../shared/domain/model/date-time.js';

/** Assert a resource-shaped object, excluding null and arrays. */
export function objectValue(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError(`${field} must be an object`);
  return value;
}

/** Trim text without coercing arbitrary values into display strings. */
export function textValue(value, field, {optional = false} = {}) {
  if (optional && value == null) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()))
    throw new TypeError(`${field} must be ${optional ? 'text' : 'non-empty text'}`);
  return value.trim();
}

/** Preserve missing measurements as null; never convert them to zero. */
export function measurement(value, field, {integer = false, min = 0, max = Infinity} = {}) {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max ||
      (integer && !Number.isSafeInteger(value)))
    throw new RangeError(`Invalid ${field}`);
  return value;
}

/** Keep numeric or textual fake-API identifiers without silently coercing them. */
export function identifier(value, field, {optional = false} = {}) {
  if (optional && value == null) return null;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new TypeError(`Invalid ${field}`);
}

/** Validate an actual ISO calendar date, rejecting normalized dates such as February 30. */
export function calendarDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new TypeError(`Invalid ${field}`);
  const instant = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 10) !== value)
    throw new RangeError(`Invalid ${field}`);
  return value;
}

/**
 * Read an ISO timestamp with an explicit offset into the shared immutable DateTime.
 * JavaScript stores instants at millisecond precision; strings with finer precision
 * are normalized accordingly. Date-only NDVI observations mean midnight UTC.
 * @param {string|DateTime} value
 * @param {string} field
 * @param {{allowDateOnly?: boolean}} options
 * @returns {DateTime}
 * @throws {TypeError|RangeError} When the calendar date, time or offset is invalid.
 */
export function timestamp(value, field, {allowDateOnly = false} = {}) {
  if (value instanceof DateTime) return new DateTime(value.toISOString());
  if (allowDateOnly && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return new DateTime(`${calendarDate(value, field)}T00:00:00Z`);
  const match = typeof value === 'string' && value.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59)
    throw new TypeError(`Invalid ${field}`);
  calendarDate(match[1], field);
  if (!Number.isFinite(Date.parse(value))) throw new RangeError(`Invalid ${field}`);
  return new DateTime(value);
}
