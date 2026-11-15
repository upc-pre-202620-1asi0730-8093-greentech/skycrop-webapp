# Reports domain model

## Current runtime contract

The frontend continues to use the published mock API through
`VITE_SKYCROP_API_URL` and `VITE_SKYCROP_REPORTS_ENDPOINT_PATH`. This refactor does
not change environment files, switch API hosts, create a fake API, or modify remote
data. A local clone of the mock API repository is not required to run the frontend.

The existing Reports API client, list, detail page, chart and PDF exporter consume
plain strings, numbers and collection resources exposed through `Report` getters.
The resource assembler is the explicit boundary between JSON and domain values.
A `Report` is not sent directly as a JSON request.

## Entity and value objects

`Report` has an optional identity until persistence and stores validated values
instead of a shallow copy of an unvalidated response. Constructor inputs and all
returned nested arrays are isolated from the entity. Collection getters return
fresh resources, including the crop arrays inside performance rows.

| Value object | Rule |
|---|---|
| `ReportTitle` | Non-empty trimmed title; case-sensitive value equality. |
| `ReportType` | `MONITORING` or `SEASONAL`; textual codes normalize to uppercase. |
| `ReportSeason` | Known season code, or empty for legacy monitoring reports. Seasonal reports require a season. |
| `ReportMetrics` | Non-negative safe-integer flight/alert counts, finite NDVI within `[-1,1]`, non-negative finite area. Missing values remain `null`. |
| `NdviEvolutionItem` | Valid ISO observation date and a measured finite NDVI in `[-1,1]`. |
| `ReportPerformanceItem` | Plot identifier or name, isolated crop-name collection and validated per-plot metrics. Legacy string crop values normalize to a one-item array. |
| `ReportPeriod` | Real calendar dates, ordered boundaries and inclusive UTC-day selection. |

Value objects are immutable and provide value-based `equals` methods and primitive
`toJSON` resources. Report identity remains separate from these value objects.
The existing shared `DateTime` represents instants; timestamps require an explicit
time-zone offset and normalize to UTC at JavaScript millisecond precision. Legacy
NDVI date-only readings mean midnight UTC. Invalid calendar dates such as February
30 are rejected rather than normalized into another month.

IDs accept existing textual fake-API identifiers and positive integer identifiers.
Source IDs must be unique. Missing owner/generator labels remain empty; no person
or drone identity is invented. A missing year defaults to the generation instant's
UTC year, independently of the browser or server's local timezone.

## Seasonal generation

`createSeasonalReport` accepts validated Report entities and period attributes. It
selects at least five distinct persisted monitoring reports inside the inclusive
UTC period. Existing seasonal reports cannot become sources of another seasonal
report. The result retains its source IDs and period boundaries when mapped back
to the API resource.

The existing aggregation semantics are preserved:

- Counts are summed only when every source has the reading.
- NDVI uses the existing unweighted mean of source report means. It is not an area-weighted estimate.
- Missing source readings propagate as `null`, rather than fabricated zeros.
- Seasonal area remains unknown because repeated plot areas cannot be safely summed.
- Generation years retain the form's existing range of 2000 through 2100.
- Season/year labels do not infer hemisphere-specific seasons or override the selected dates.

The store preserves the `Insufficient reports` error used by the UI translation.
The assembler now retains `startDate` and `endDate` directly from the entity, so the
store does not append a second, potentially inconsistent copy of the period.

## Backend integration boundary

The Reports domain found in the backend's `feature/create-report` branch is not yet
an interchangeable HTTP contract for the running fake API. Its command flattens
metrics, requires owner/generator names and uses concrete measurement values;
the current frontend payload nests `metrics` and legitimately contains unknown
values and historical reports without ownership information.

Before switching Reports to that backend, its public request/response resources
must define how those cases are represented. The transport assembler can then be
adapted explicitly. This frontend change does not flatten requests, invent
ownership, replace unknown surface area with zero, or depend on unconfirmed
backend serialization of enums and value objects.

## Documentation conventions

Public entities, value objects, assemblers, API operations, seasonal generation,
store operations and PDF export have English JSDoc describing their contracts,
returns and relevant error behavior. Comments explain domain decisions and
boundaries rather than restating every assignment. UI translations and existing
report content remain unchanged.

## Verification

```sh
npm ci
npm run build
```

An optional read-only connectivity check uses the existing Vite configuration:

```sh
npm run check:reports-api
npm run check:reports-api -- production
```

This command fetches the configured collection and validates each resource through
the assembler. It sends no POST, PATCH, PUT or DELETE requests.
