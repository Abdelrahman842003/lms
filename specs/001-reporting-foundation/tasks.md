# Tasks: Reporting Foundation

**Input**: Design documents from `/specs/001-reporting-foundation/`
**Prerequisites**: plan.md (required), spec.md (required)
**Tests**: Not explicitly requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/app/Domains/Reporting/` for all reporting foundation code
- Paths follow existing DDD structure: `Domain/`, `Application/`, `Infrastructure/`, `Presentation/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Reporting domain directory structure matching the existing DDD convention

- [X] T001 Create Reporting domain directory structure with subdirectories `Application/Actions/`, `Application/Builders/`, `Application/Export/`, `Domain/ValueObjects/`, `Domain/DTO/`, `Domain/Services/`, `Domain/Contracts/`, `Domain/Enums/`, `Infrastructure/Filters/`, `Infrastructure/Queries/`, `Presentation/Resources/` under `backend/app/Domains/Reporting/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core value objects and contracts that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create ReportingPeriodPreset enum with values `today`, `last_7_days`, `this_month`, `last_month`, `last_3_months`, `this_year`, `custom_range` in `backend/app/Domains/Reporting/Domain/Enums/ReportingPeriodPreset.php`
- [X] T003 [P] Create GranularityHint enum with values `day`, `week`, `month` in `backend/app/Domains/Reporting/Domain/Enums/GranularityHint.php`
- [X] T004 [P] Create ComparisonMode enum with values `previous_period`, `same_period_last_year` in `backend/app/Domains/Reporting/Domain/Enums/ComparisonMode.php`
- [X] T005 [P] Create Direction enum with values `up`, `down`, `stable` in `backend/app/Domains/Reporting/Domain/Enums/Direction.php`
- [X] T006 [P] Create AlertSeverity enum with values `info`, `warning`, `critical` in `backend/app/Domains/Reporting/Domain/Enums/AlertSeverity.php`
- [X] T007 Create ReportingPeriod immutable value object with properties `start_at`, `end_at`, `timezone`, `preset`, `granularity_hint` and helpers for inclusive boundaries in `backend/app/Domains/Reporting/Domain/ValueObjects/ReportingPeriod.php`
- [X] T008 Create ComparisonPeriod immutable value object with properties `mode`, resolved `start_at`/`end_at` boundaries derived from ReportingPeriod in `backend/app/Domains/Reporting/Domain/ValueObjects/ComparisonPeriod.php`
- [X] T009 Create ReportFilters value object encapsulating date range (preset/custom), comparison mode, entity type, plan, subscription status, growth direction, and usage threshold in `backend/app/Domains/Reporting/Domain/ValueObjects/ReportFilters.php`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Reporting Period Model & Filter Normalization (Priority: P1) 🎯 MVP

**Goal**: Deliver the shared reporting period model, comparison period derivation, filter normalization, and query scoping so that all future reports have a single authoritative way to resolve time ranges.

**Independent Test**: Given an HTTP request with various filter params (preset, custom range, comparison mode), the normalizer returns a validated `ReportFilters` VO with correctly resolved `ReportingPeriod` and `ComparisonPeriod` boundaries. Edge cases (invalid range, missing defaults) return deterministic errors.

### Implementation for User Story 1

- [X] T010 [US1] Implement ReportFilterNormalizer that converts incoming request params to ReportFilters VO, normalizes timezone, enforces inclusive boundaries, rejects invalid ranges, resolves default comparison mode in `backend/app/Domains/Reporting/Infrastructure/Filters/ReportFilterNormalizer.php`
- [X] T011 [P] [US1] Implement SharedDateScope query helper providing reusable Eloquent query scopes for date-bounded queries using ReportingPeriod in `backend/app/Domains/Reporting/Infrastructure/Queries/SharedDateScope.php`
- [X] T012 [P] [US1] Implement SharedEntityScope query helper providing reusable Eloquent query scopes for entity-type and plan-based filtering in `backend/app/Domains/Reporting/Infrastructure/Queries/SharedEntityScope.php`
- [X] T013 [US1] Implement BuildReportContextAction that accepts raw request input, delegates to ReportFilterNormalizer, and returns a fully resolved report context (ReportingPeriod + ComparisonPeriod + ReportFilters) in `backend/app/Domains/Reporting/Application/Actions/BuildReportContextAction.php`
- [X] T014 [US1] Implement ResolveComparisonContextAction that takes a ReportingPeriod and ComparisonMode and returns a ComparisonPeriod with correctly calculated boundaries (handles leap year, partial ranges, month/year alignment) in `backend/app/Domains/Reporting/Application/Actions/ResolveComparisonContextAction.php`

**Checkpoint**: Reporting period model and filter normalization fully functional — all future reports can resolve time ranges through one path

---

## Phase 4: User Story 2 — KPI Card Format & Trend Calculation (Priority: P2)

**Goal**: Deliver the shared KPI card contract, trend metric contract, KPI factory, and trend calculation service so that all reports produce consistent metric displays with deterministic comparison logic.

**Independent Test**: Given current and baseline numeric values (positive, negative, zero, null), the trend calculator returns correct `change_pct`, `direction`, and handles all edge cases (zero baseline, null baseline). KPI factory produces cards with all required fields.

### Implementation for User Story 2

- [X] T015 [US2] Create KpiCardResult DTO with properties `key`, `title`, `current_value`, `baseline_value`, `change_pct`, `direction`, optional `status_color`, `note`, `drilldown_key` in `backend/app/Domains/Reporting/Domain/DTO/KpiCardResult.php`
- [X] T016 [P] [US2] Create TrendMetricResult DTO with properties `series` (array of `{label, value}`) and `summary` (`current`, `baseline`, `change_pct`, `direction`) in `backend/app/Domains/Reporting/Domain/DTO/TrendMetricResult.php`
- [X] T017 [US2] Implement TrendCalculationService as stateless service handling: delta math `(c-b)/|b|*100`, rounding, stable threshold, zero-baseline edge cases, null-baseline handling in `backend/app/Domains/Reporting/Domain/Services/TrendCalculationService.php`
- [X] T018 [US2] Implement KpiCardFactory that produces consistent KpiCardResult instances from metric definitions + resolved period context, guaranteeing common field presence in `backend/app/Domains/Reporting/Domain/Services/KpiCardFactory.php`
- [X] T019 [US2] Implement SummaryBuilder that accepts metric definitions + resolved period context and emits a normalized collection of KPI cards in `backend/app/Domains/Reporting/Application/Builders/SummaryBuilder.php`
- [X] T020 [US2] Implement KpiCardResource API resource enforcing common JSON schema for KPI card responses in `backend/app/Domains/Reporting/Presentation/Resources/KpiCardResource.php`
- [X] T021 [US2] Implement TrendMetricResource API resource enforcing common JSON schema for trend metric responses in `backend/app/Domains/Reporting/Presentation/Resources/TrendMetricResource.php`
- [X] T022 [US2] Implement AppliedFiltersResource API resource normalizing filter context in API responses in `backend/app/Domains/Reporting/Presentation/Resources/AppliedFiltersResource.php`

**Checkpoint**: KPI cards and trend calculations fully functional — any report can produce consistent metric displays

---

## Phase 5: User Story 3 — Alert Engine & Drill-Down Behavior (Priority: P3)

**Goal**: Deliver the shared alert contract, alert rule engine with baseline categories, drill-down contract, drill-down registry, and breakdown builder so that all reports can surface actionable alerts and support predictable drill-down navigation.

**Independent Test**: Alert engine evaluates ordered rules and returns ranked alerts with correct severity. Drill-down registry maps metric keys to descriptors with allowed filters and default sort. Breakdown builder emits consistent table payload.

### Implementation for User Story 3

- [X] T023 [US3] Create AlertResult DTO with properties `alert_key`, `severity`, `message`, `context`, `source_section` in `backend/app/Domains/Reporting/Domain/DTO/AlertResult.php`
- [X] T024 [P] [US3] Create DrilldownDescriptor DTO with properties `drilldown_key`, `title`, `supported_filters`, `table_schema`, `default_sort` in `backend/app/Domains/Reporting/Domain/DTO/DrilldownDescriptor.php`
- [X] T025 [US3] Create AlertRule interface with method `evaluate(context): ?AlertResult` in `backend/app/Domains/Reporting/Domain/Contracts/AlertRule.php`
- [X] T026 [US3] Implement AlertEngine that executes ordered AlertRule instances and returns ranked AlertResult collection (attendance drop, revenue drop, usage near limit, high inactivity, renewal approaching, strong growth categories) in `backend/app/Domains/Reporting/Domain/Services/AlertEngine.php`
- [X] T027 [US3] Implement DrilldownRegistry mapping top-level metric keys to available DrilldownDescriptor instances (Total students → by academy/teacher/group, Attendance rate → by teacher/course/group, Revenue → by month/source/teacher/academy, Subscription usage → by entity and plan) in `backend/app/Domains/Reporting/Domain/Services/DrilldownRegistry.php`
- [X] T028 [US3] Implement BreakdownBuilder accepting row mapper + schema descriptor + pagination/sorting request and emitting consistent table payload in `backend/app/Domains/Reporting/Application/Builders/BreakdownBuilder.php`
- [X] T029 [US3] Implement AlertResource API resource normalizing alert responses in `backend/app/Domains/Reporting/Presentation/Resources/AlertResource.php`

**Checkpoint**: Alert engine and drill-down behavior fully functional — all reports can surface alerts and support drill-down

---

## Phase 6: User Story 4 — Export Foundation, Authorization Hooks & Response States (Priority: P4)

**Goal**: Deliver the export payload builder, report access policy contract, and shared empty/loading/error response conventions so that all reports support consistent data export and role-safe access.

**Independent Test**: Export payload builder produces valid blocks (summary KPIs, breakdown rows, detailed rows, filter metadata) from any report context. Authorization gate enforces scope before report execution. Empty datasets return valid schema with zero/empty arrays.

### Implementation for User Story 4

- [X] T030 [US4] Create ExportPayload DTO with properties `summary_kpis`, `breakdown_data`, `detailed_rows`, `applied_filter_metadata` in `backend/app/Domains/Reporting/Domain/DTO/ExportPayload.php`
- [X] T031 [US4] Create ReportAccessPolicy contract defining scope authorization methods for report execution and drill-down access in `backend/app/Domains/Reporting/Domain/Contracts/ReportAccessPolicy.php`
- [X] T032 [US4] Implement ExportPayloadBuilder generating export-ready blocks (summary KPI rows, breakdown table rows, detailed rows, applied filters + comparison mode + timezone metadata) independent of role in `backend/app/Domains/Reporting/Application/Export/ExportPayloadBuilder.php`
- [X] T033 [US4] Implement EmptyReportResponse helper that returns valid schema with zero/empty arrays for empty dataset scenarios in `backend/app/Domains/Reporting/Presentation/Resources/EmptyReportResource.php`
- [X] T034 [US4] Implement ErrorResponse helper with stable machine-readable error codes for report error scenarios in `backend/app/Domains/Reporting/Presentation/Resources/ReportErrorResource.php`

**Checkpoint**: Export, authorization, and response states fully functional — all reports support consistent export and error handling

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance guardrails and integration validation across all user stories

- [X] T035 [P] Register Reporting domain service providers and bindings in `backend/app/Providers/AppServiceProvider.php` or a dedicated `backend/app/Providers/ReportingServiceProvider.php`
- [X] T036 [P] Add PHPDoc type annotations and return type declarations across all Reporting domain files for IDE support and static analysis
- [X] T037 Verify that all report roles would use the same filter vocabulary by tracing filter flow from request through ReportFilterNormalizer to SharedDateScope/SharedEntityScope
- [X] T038 Verify that all trendable metrics use the same comparison logic by tracing through TrendCalculationService
- [X] T039 Verify that exported reports preserve the same filter context used on screen by tracing through ExportPayloadBuilder

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1 (Phase 3): Can start after Phase 2 — no dependencies on other stories
  - US2 (Phase 4): Can start after Phase 2 — no dependencies on other stories (uses separate DTOs/services)
  - US3 (Phase 5): Can start after Phase 2 — no dependencies on other stories
  - US4 (Phase 6): Can start after Phase 2 — no dependencies on other stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) — Period & Filters**: No dependencies on other stories
- **US2 (P2) — KPI & Trends**: No dependencies on other stories (TrendCalculationService is self-contained)
- **US3 (P3) — Alerts & Drill-Down**: No dependencies on other stories
- **US4 (P4) — Export & Auth**: No dependencies on other stories

### Within Each User Story

- DTOs/Value Objects before Services
- Services before Builders/Actions
- Builders before Resources
- Core implementation before integration

### Parallel Opportunities

- **Phase 2**: T002–T006 (all enums) can run in parallel; T007–T009 (VOs) can run in parallel after enums
- **Phase 3 (US1)**: T011 and T012 (query scopes) can run in parallel; T010 and T014 (normalizer + comparison resolver) can run in parallel
- **Phase 4 (US2)**: T015 and T016 (DTOs) can run in parallel; T020, T021, T022 (resources) can run in parallel
- **Phase 5 (US3)**: T023 and T024 (DTOs) can run in parallel
- **Phase 6 (US4)**: T030 and T031 (DTO + contract) can run in parallel; T033 and T034 (response resources) can run in parallel
- **Phase 7**: T035 and T036 can run in parallel; T037, T038, T039 can run in parallel
- **Cross-story**: After Phase 2, all four user stories (Phase 3–6) can be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch DTOs/enums together:
Task: "T002 Create ReportingPeriodPreset enum in backend/app/Domains/Reporting/Domain/Enums/ReportingPeriodPreset.php"
Task: "T003 Create GranularityHint enum in backend/app/Domains/Reporting/Domain/Enums/GranularityHint.php"
Task: "T004 Create ComparisonMode enum in backend/app/Domains/Reporting/Domain/Enums/ComparisonMode.php"
Task: "T005 Create Direction enum in backend/app/Domains/Reporting/Domain/Enums/Direction.php"
Task: "T006 Create AlertSeverity enum in backend/app/Domains/Reporting/Domain/Enums/AlertSeverity.php"

# Launch query scopes together:
Task: "T011 Implement SharedDateScope in backend/app/Domains/Reporting/Infrastructure/Queries/SharedDateScope.php"
Task: "T012 Implement SharedEntityScope in backend/app/Domains/Reporting/Infrastructure/Queries/SharedEntityScope.php"
```

## Parallel Example: User Story 2

```bash
# Launch DTOs together:
Task: "T015 Create KpiCardResult DTO in backend/app/Domains/Reporting/Domain/DTO/KpiCardResult.php"
Task: "T016 Create TrendMetricResult DTO in backend/app/Domains/Reporting/Domain/DTO/TrendMetricResult.php"

# Launch resources together:
Task: "T020 Implement KpiCardResource in backend/app/Domains/Reporting/Presentation/Resources/KpiCardResource.php"
Task: "T021 Implement TrendMetricResource in backend/app/Domains/Reporting/Presentation/Resources/TrendMetricResource.php"
Task: "T022 Implement AppliedFiltersResource in backend/app/Domains/Reporting/Presentation/Resources/AppliedFiltersResource.php"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T009) — BLOCKS all stories
3. Complete Phase 3: User Story 1 — Period & Filters (T010–T014)
4. **STOP and VALIDATE**: Test that filter normalization resolves correctly for all presets and custom ranges
5. This delivers the minimum viable foundation that all future reports depend on

### Incremental Delivery

1. Complete Setup + Foundational (T001–T009) → Foundation contracts ready
2. Add US1 (T010–T014) → Filter resolution working → Validate independently
3. Add US2 (T015–T022) → KPI cards and trends working → Validate independently
4. Add US3 (T023–T029) → Alerts and drill-down working → Validate independently
5. Add US4 (T030–T034) → Export and auth working → Validate independently
6. Polish (T035–T039) → Cross-cutting validation
7. **Ready for Spec 002 (Admin Reports)**: plug section-specific query services into shared builders

### Parallel Team Strategy

With multiple developers after Phase 2 completes:

- **Developer A**: US1 (Phase 3) — Period & Filters
- **Developer B**: US2 (Phase 4) — KPI & Trends
- **Developer C**: US3 (Phase 5) — Alerts & Drill-Down
- Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths follow existing DDD convention in `backend/app/Domains/`
- Future specs (002 Admin, 003 Academy, 004 Teacher) compose over these shared primitives
