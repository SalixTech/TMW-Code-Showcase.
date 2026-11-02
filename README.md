# TripMaster Web — Commercial Fleet Payroll & Driver Telematics Engine

A curated architectural showcase demonstrating domain-specific payroll algorithms, cross-time-zone workweek calculations, and operational trip management built for the TripMaster commercial driver platform.

This repository highlights selected implementation modules—specifically focusing on pure additive pay calculation engines, configurable exception rule trees, time-zone calendar aggregation, and stateful driver dashboards[cite: 8].

---

### Core Engineering Competencies Demonstrated

- **Multi-Variable Rate Calculation Engine:** Pure arithmetic calculation pipeline evaluating mileage, hourly rates, incremental stop fees, trailer bonuses, and shag operations[cite: 8].
- **Configurable Trip-ID Exception Rules:** Granular override architecture evaluating normalized trip identifiers against user/fleet-defined exception rules to modify additive pay categories dynamically[cite: 8].
- **Time-Zone-Aware Payroll Aggregation:** Strict calendar workweek boundary calculations supporting all four primary contiguous US time zones, enabling accurate completed-trip partitioning and week-over-week wage summaries[cite: 8].
- **Driver Interface State Machines:** Modular React screens handling period filtering, pending vs. completed trip sorting, configurable data grids, and session-persisted display preferences[cite: 8].
- **Operational Fleet Aggregations:** High-efficiency data rollups including unique asset tracking (trailer count metrics), dispatch lifecycle transitions, and resilient UI error states[cite: 8].

---

### Tech Stack & Architecture

- **Language & Runtime:** TypeScript (Strict Mode), React, Node.js[cite: 1, 8]
- **Design Pattern:** Pure Business Logic Decoupling (Pure arithmetic and time-series helpers isolated from UI and transport layers)[cite: 8]
- **Target Platform:** Commercial fleet web platform & mobile PWA (`app.salixtechnologies.com`)[cite: 8]

---

### Module Reading Guide

| Module / Path | Domain | Architectural Highlight |
| :--- | :--- | :--- |
| [`src/lib/payStorage.ts`](src/lib/payStorage.ts)[cite: 8] | **Payroll Calculation Engine** | Pure arithmetic engine evaluating mileage, stop pay, hourly wages, trailer handling, and shag pay with enabled exception-rule overrides[cite: 8]. |
| [`src/lib/payroll.ts`](src/lib/payroll.ts)[cite: 8] | **Time-Zone Boundary Modeling** | Calendar-based workweek boundaries spanning four US time zones, completed-trip filtering, and weekly historical summaries[cite: 8]. |
| [`src/types/trip.ts`](src/types/trip.ts)[cite: 8]<br>[`src/types/pay.ts`](src/types/pay.ts)[cite: 8] | **Fleet Domain Schemas** | Typed contracts defining trip lifecycles, per-trip rate locks, category toggles, and exception rules[cite: 8]. |
| [`src/components/PayScreen.tsx`](src/components/PayScreen.tsx)[cite: 8] | **Financial Presentation** | Period filtering, reactive wage totals, detailed itemization drawer, and session-scoped column preferences[cite: 8]. |
| [`src/components/TripsScreen.tsx`](src/components/TripsScreen.tsx)[cite: 8] | **Operational Data Grid** | Pending vs. completed record ordering, full-text trip search, dynamic column toggling, and clean navigation callbacks[cite: 8]. |
| [`src/components/DashboardScreen.tsx`](src/components/DashboardScreen.tsx)[cite: 8] | **Fleet Metrics Composition** | Multi-variable summary cards, unique asset counting (trailers), and structured fallback/error boundaries[cite: 8]. |

---

### Architectural Design Decisions & Isolation Scope

- **Pure Functional Calculation:** Pay calculation helpers are structured as pure, side-effect-free algorithms[cite: 8]. They compute deterministic wage values without external state dependencies, making them trivially unit-testable and reusable across client and server runtimes[cite: 8].
- **Historical Rate Integrity:** Trip models capture immutable per-trip rate snapshots at the time of creation, preventing subsequent global fleet setting changes from retroactively corrupting past payroll history[cite: 8].
- **Sanitization & Isolation:** Proprietary customer records, credentials, cloud database connectors, and production telemetry are strictly omitted for data privacy[cite: 8]. All internal imports cleanly resolve within `src/` to demonstrate code structure, typing discipline, and algorithmic design[cite: 8].

---

### Rights

No open-source license is granted by this showcase[cite: 6, 8]. Inclusion of source does not grant reuse or redistribution rights[cite: 6, 8].
