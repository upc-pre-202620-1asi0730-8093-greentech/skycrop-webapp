# Architecture Decision Records (ADRs)

## About

This document records the principal architecture decisions made for the SkyCrop web application.
Each record follows the lightweight format proposed by Michael Nygard: **Context**, **Decision**, **Consequences**, plus a **Status** and **Date**.

## Index

| ADR | Title | Status |
|:---:|:------|:-------|
|[ADR-001](#adr-001---use-of-a-layered-domain-driven-design-ddd-structure)| Use of a layered Domain Driven Design (DDD) structure | Accepted |
|[ADR-002](#adr-002---replace-default-types-with-value-objects)| Replace default types with value objects | Accepted |
|[ADR-003](#adr-003---declare-a-base-api-to-extend-in-each-api-service)| Declare a Base API to extend in each API service | Accepted |

---

## ADR-001 - Use of a layered Domain Driven Design (DDD) structure

- **Status:** Accepted
- **Date:** 2026-10-04

### Context

The application needs to grow and contain many business rules of different contexts (Plots, Drones, Reports, among others). 
A structure is needed to organize and scale business logic without complicating development.

### Decision

Structure the frontend application code using Domain Driven Design bounded contexts and layers:

**Bounded contexts:**
- Plots
- Drones
- Diagnoses
- Reports
- Crops
- Shared

**Layers per context:**
- Domain: Entities, value objects and interfaces
- Infrastructure: API services, resources and assemblers
- Application: State management stores
- Presentation: UI Components and views

### Consequences

**Positives**
- Business logic divided by bounded contexts
- High code maintainability
- Better communication between developers

**Negatives**
- Higher amount of folders and files to edit
- Greater development effort needed

---

## ADR-002 - Replace default types with value objects

- **Status:** Accepted
- **Date:** 2026-10-21

### Context

The current application uses default JavaScript types on every entity, validations have to be done in many cases.

### Decision

Replace main attributes of the entities with value objects, each one providing business logic validations according to the context.

### Consequences

**Positives**
- Centralized validation per value object
- Better code communication
- Greater code reuse

**Negatives**
- Higher amount of files and classes
- Need to adapt value objects for API services


---

## ADR-003 - Declare a Base API to extend in each API service

- **Status:** Accepted
- **Date:** 2026-10-28

### Context

Currently, the application makes HTTP requests to the API using its endpoints directly for each bounded context. 
This generates problems like code repetition, inconsistency and maintenance difficulty. 

### Decision

Create a Base API and Base Endpoint class which contains the main CRUD operations, and then extend said class in each API service inside a bounded context's infrastructure layer. 

### Consequences

**Positives**
- Code reuse
- Standardization of API calls
- Greater maintainability of every API service

**Negatives**
- Need to create specific implementations for particular cases