# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-09

### Added

- Plots Bounded Context:
    - Domain model for `agricultural-plot`
    - Infrastructure layer with `plots-api`, `agricultural-plot.assembler` and `plot-location-api`
    - Application layer with state management using `plots.store`
    - Presentation views `plot-details`, `plot-list`, `plot-registration` and components `plot-image`, `plot-map`
- Drones Bounded Context:
    - Domain model for `drone` and `flight-route`
    - Infrastructure layer with `drones-api` and `drones.assembler`
    - Application layer with state management using `drones.store`
    - Presentation views `drone-details`, `drone-list`, `drone-regitration` and components `drone-image`, `flight-route-editor`, `route-map`
- Diagnoses Bounded Context:
    - Domain model for `diagnosis` and `anomaly`, including `diagnosis-scenarios`
    - Infrastructure layer with `diagnosis-resource`, `diagnoses-api` and `diagnosis.assembler`
    - Application layer with state management using `diagnoses.store`
    - Presentation views `diagnoses-list`, `diagnosis-details` and component `diagnosis-map`
- Field Management Bounded Context:
    - Domain model for `crop`
    - Infrastructure layer with `crops-api` and `crop.assembler`
    - Application layer with state management using `crops-store`
    - Presentation views `crop-details`, `crop-list` and component `crop-form`
- Reports Bounded Context:
    - Domain model for `report`, including `seasonal-report`
    - Infrastructure layer with `reports-api`, `report-pdf` and `report.assembler`
    - Application layer with state management using `reports.store`
    - Presentation views `report-list`, `report-details` and component `ndvi-chart`
- Shared Components:
    - Shared domain model for `date-time`, including `string-validator`
    - Application presentation components `layout` and `language-switcher`, using a placeholder view `pending-section`
    - Internationalization using `vue-i18n`, supporting English and Spanish
    - Mock api using `json-server`
    - Application routing using `vue-router`