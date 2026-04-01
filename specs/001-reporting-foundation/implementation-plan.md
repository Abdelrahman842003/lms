# Implementation Plan: Reporting Foundation (Spec 001)

## 1) Feature Summary

### What is being built
Build a **shared reporting foundation** for the LMS so Admin, Academy, and Teacher reports all rely on the same primitives:
- reporting period model
- comparison period model
- filter vocabulary and normalization
- KPI card contract
- trend calculation rules
- alert contract and rule engine base
- drill-down contract
- export metadata/payload contract

### Why the current approach is insufficient
Without a shared foundation, each role report will likely implement its own:
- date ranges and comparison windows
- metric naming and data shapes
- trend and direction logic
- alert semantics
- drill-down behavior

This leads to logic drift, inconsistent UX, and high maintenance overhead.

### Why this foundation is required now
The platform is multi-tenant and plan-driven (linked student capacity), and upcoming report specs depend on consistent time-based logic. Building this foundation first prevents duplication and de-risks Admin/Academy/Teacher implementation.

---

## 2) Architecture Strategy (Laravel DDD)

Create a dedicated module under `backend/app/Domains/Reporting` with strict separation:

- **Application layer**
  - Orchestrates report context creation and section assembly.
  - Handles request parsing and execution pipeline.

- **Domain layer**
  - Immutable value objects and shared contracts.
  - Stateless services for trend calculations and alert evaluation.

- **Infrastructure layer**
  - Shared filter-to-query adapters.
  - Reusable query primitives (date scoping, entity scoping).

- **Presentation layer**
  - Response resources/transformers that enforce common schema.

### Reuse and anti-duplication strategy
- One authoritative `ReportFilters` object for all roles.
- One trend calculator implementation and one KPI result schema.
- One drill-down descriptor contract reused by all report pages.
- Role-specific reports become composition over shared primitives, not reimplementation.

---

## 3) Core Reporting Concepts and Contracts

### Reporting Period
Immutable VO containing:
- `start_at`, `end_at`, `timezone`, `preset`
- `granularity_hint` (`day`, `week`, `month`) for trends
- helpers for inclusive boundaries

Supported presets:
- today
- last_7_days
- this_month
- last_month
- last_3_months
- this_year
- custom_range

### Comparison Period
Derived VO:
- `mode`: `previous_period` | `same_period_last_year`
- exact resolved boundaries for baseline calculations

### KPI Card Contract
Common structure:
- `key`, `title`
- `current_value`, `baseline_value`
- `change_pct`, `direction` (`up/down/stable`)
- `status_color?`, `note?`, `drilldown_key?`

### Trend Metric Contract
- `series`: array of `{label, value}`
- `summary`: `{current, baseline, change_pct, direction}`

### Alert Contract
- `alert_key`, `severity`, `message`, `context`, `source_section`

### Drill-down Contract
- `drilldown_key`, `title`, `supported_filters`, `table_schema`, `default_sort`

### Export Contract
- `summary_kpis`
- `breakdown_data`
- `detailed_rows`
- `applied_filter_metadata`

---

## 4) Domain Design

## Suggested structure

- `Domains/Reporting/Application/`
  - `Actions/BuildReportContextAction.php`
  - `Actions/ResolveComparisonContextAction.php`
  - `Builders/SummaryBuilder.php`
  - `Builders/BreakdownBuilder.php`
  - `Export/ExportPayloadBuilder.php`

- `Domains/Reporting/Domain/`
  - `ValueObjects/ReportingPeriod.php`
  - `ValueObjects/ComparisonPeriod.php`
  - `ValueObjects/ReportFilters.php`
  - `DTO/KpiCardResult.php`
  - `DTO/TrendMetricResult.php`
  - `DTO/AlertResult.php`
  - `DTO/DrilldownDescriptor.php`
  - `Services/TrendCalculationService.php`
  - `Services/AlertEngine.php`
  - `Services/KpiCardFactory.php`

- `Domains/Reporting/Infrastructure/`
  - `Filters/ReportFilterNormalizer.php`
  - `Queries/SharedDateScope.php`
  - `Queries/SharedEntityScope.php`

- `Domains/Reporting/Presentation/`
  - `Resources/KpiCardResource.php`
  - `Resources/TrendMetricResource.php`
  - `Resources/AlertResource.php`
  - `Resources/AppliedFiltersResource.php`

### Responsibilities
- **VOs**: enforce valid state and deterministic period derivations.
- **Trend service**: centralize delta math, rounding, and stable threshold.
- **KPI factory**: produce consistent KPI outputs regardless of role.
- **Alert engine**: run rule objects with deterministic priority ordering.
- **Builders**: compose section payloads from contracts only.
- **Resources**: normalize final API output shape.

---

## 5) Filter and Time Logic Design

### Filter grammar
Required shared filters:
- date range (preset/custom)
- comparison mode
- entity type
- plan
- subscription status
- growth direction
- usage threshold

### Normalization rules
- Convert all incoming dates to app/report timezone.
- Enforce inclusive start and end boundaries.
- Reject invalid range (`start > end`).
- Resolve default comparison mode when omitted.

### Comparison logic rules
- `previous_period`: same duration immediately preceding current range.
- `same_period_last_year`: same calendar-aligned range shifted back one year.
- Same logic reused by all future report roles.

### Deterministic direction logic
Given current value $c$ and baseline $b$:
- if baseline is null/undefined: `direction = stable`, `change_pct = null`
- if $b = 0$ and $c > 0$: configured behavior (`change_pct = null` or sentinel), `direction = up`
- if $b = 0$ and $c = 0$: `change_pct = 0`, `direction = stable`
- otherwise $\text{change\_pct} = \frac{c-b}{|b|} \times 100$

---

## 6) Shared Summary, Breakdown, and Drill-down Foundation

### Summary builder foundation
- Accepts metric definitions + resolved period context.
- Emits normalized KPI card collection.
- Guarantees common field presence.

### Breakdown builder foundation
- Accepts row mapper + schema descriptor + pagination/sorting request.
- Emits consistent table payload for any section.

### Drill-down registry
- Map top-level metric keys to available drill-down descriptors.
- Include allowed filters and default sort for predictable behavior.

### Empty/loading/error response conventions
- Empty data returns valid schema with zero/empty arrays.
- Error shape includes stable machine-readable codes.
- Loading is frontend concern, but backend should return deterministic payload quickly.

---

## 7) Alert Foundation

### Alert architecture
- `AlertRule` interface with `evaluate(context): ?AlertResult`.
- `AlertEngine` executes ordered rules and returns ranked alerts.

### Shared baseline alert categories
- attendance drop
- revenue drop
- usage near limit
- high inactivity
- renewal approaching
- strong growth

### Alert metadata requirements
- consistent severity vocabulary (`info`, `warning`, `critical`)
- threshold source traceability in context payload
- related drill-down key for immediate action

---

## 8) Export Foundation

### Export payload builder
Generate export-ready blocks independent of role:
- summary KPI rows
- breakdown table rows
- detailed rows
- applied filters + comparison mode + timezone metadata

### Format strategy
- v1: payload contract only (sync response representation)
- v2: async file generation (CSV/XLSX) without changing upstream section contracts

---

## 9) Authorization Integration Points

### Foundation-level authorization hooks
- Require explicit scope authorization before report execution.
- Enforce drill-down authorization independently from summary access.

### Design
- Define `ReportAccessPolicy` contract at foundation layer.
- Role-specific policies plugged by Admin/Academy/Teacher implementations.

---

## 10) Performance and Scalability Strategy

### Risks at foundation level
- duplicated filter parsing in multiple endpoints
- inconsistent query boundaries causing expensive scans
- response inflation due to nested repeated metadata

### v1 guardrails
- normalized filter object reused across all section queries
- shared query scopes for date/entity constraints
- avoid N+1 by enforcing builder inputs as pre-aggregated datasets
- optional short TTL caching for repeated foundation-level computed metadata

### Future-ready strategy
- keep DTO contracts stable so materialized/snapshot backends can swap in later
- support monthly fact-table integration without changing response contracts

---

## 11) Validation Strategy

### Unit tests
- `ReportingPeriod` preset and custom range resolution
- `ComparisonPeriod` derivation (including leap year/partial ranges)
- trend calculation cases (positive/negative/stable/zero baseline)
- KPI factory contract completeness
- alert engine ordering and deterministic outputs

### Feature tests
- filter request validation and normalization behavior
- consistent response schema for summary/trend/alerts/drill-down descriptors
- authorization gate behavior for report access points

### Edge cases
- empty datasets must still return valid KPI/trend/alert schema
- missing baseline values should not crash or emit invalid math
- custom ranges crossing month/year boundaries

### Non-functional checks
- query count and latency assertions for foundation orchestration endpoints
- payload size sanity assertions for export-ready metadata

---

## 12) Phased Execution Plan

### Phase 1 — Contracts and Value Objects
- Build: `ReportingPeriod`, `ComparisonPeriod`, `ReportFilters`, base DTOs.
- Deliverable: compile-safe domain contracts and unit tests.
- Risk: unresolved metric ambiguity; mitigate with early definitions log.

### Phase 2 — Shared Services
- Build: trend calculator, KPI factory, alert engine base.
- Deliverable: deterministic shared calculation pipeline.
- Risk: inconsistent zero-baseline behavior; mitigate with explicit tests.

### Phase 3 — Builder Layer and Resources
- Build: summary builder, breakdown builder, drill-down registry, shared resources.
- Deliverable: reusable response composition layer.
- Risk: schema drift; mitigate with snapshot tests.

### Phase 4 — Export and Authorization Hooks
- Build: export payload builder + policy integration points.
- Deliverable: role-safe and export-ready reporting foundation.
- Risk: policy coupling; mitigate via contracts and adapters.

### Phase 5 — Foundation Hardening
- Build: performance guardrails, shared fixtures, documentation updates.
- Deliverable: stable base ready for Admin (Spec 002) implementation.
- Risk: premature optimization; mitigate by profiling-based fixes only.

---

## 13) Open Questions (Must be clarified before dependent role implementations)

1. Exact meaning of “meaningful activity” for active student classification.
2. Standard behavior for `change_pct` when baseline is zero.
3. Canonical timezone source (global app vs tenant-specific).
4. Mandatory vs optional filters per report role.
5. Whether export generation is required synchronously in v1.

---

## 14) Readiness for Next Specs

This foundation plan directly enables:
- **Spec 002 (Admin Reports):** plug section-specific query services into shared builders.
- **Spec 003 (Academy Reports):** reuse filters/periods/trends with academy scope adapter.
- **Spec 004 (Teacher Reports):** reuse contracts and drill-down behavior with teacher scope adapter.

Outcome: future report specs become incremental composition work, not architecture redesign.
