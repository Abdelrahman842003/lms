# Tasks: Admin Reports

**Input**: Design documents from `/specs/002-admin-reports/`
**Prerequisites**: plan.md (required), spec.md (required)
**Foundation**: Spec 001 (Reporting Foundation) — fully implemented in `backend/app/Domains/Reporting/`
**Tests**: Not explicitly requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/Domains/Reporting/` — extends existing Reporting domain
- **DDD layers**: `Application/Actions/`, `Application/Builders/`, `Infrastructure/Queries/`, `Presentation/Resources/`
- **API routes**: `backend/routes/api.php`
- **Policies**: `backend/app/Domains/Reporting/Infrastructure/Policies/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create Admin-specific directory structure and shared query scope infrastructure

- [X] T001 Create Admin report directory structure with subdirectories `Infrastructure/Queries/Admin/`, `Application/Actions/Admin/`, `Application/Builders/Admin/`, `Presentation/Resources/Admin/` under `backend/app/Domains/Reporting/`
- [X] T002 [P] Create AdminReportAccessPolicy implementing ReportAccessPolicy contract, restricting all admin report endpoints to admin-role users only, in `backend/app/Domains/Reporting/Infrastructure/Policies/AdminReportAccessPolicy.php`
- [X] T003 [P] Create PlatformScope query helper providing platform-wide Eloquent scopes (no tenant/entity filtering) for admin queries in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/PlatformScope.php`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared admin query services and builder base that ALL admin user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement AdminStudentActivityQueryService with methods `countLinkedStudents()`, `countActiveStudents()`, `countInactiveStudents()` using SharedDateScope and PlatformScope in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminStudentActivityQueryService.php`
- [X] T005 [P] Implement AdminEntityQueryService with methods `countAcademies()`, `countTeachers()`, `countEntitiesNearLimit()` using SharedDateScope and PlatformScope in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminEntityQueryService.php`
- [X] T006 [P] Implement AdminSubscriptionQueryService with methods `countActive()`, `countExpired()`, `countRenewalDueSoon()`, `countNewlyActivated()`, `countChurned()`, `getPlanUsageDistribution()` using SharedDateScope and PlatformScope in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminSubscriptionQueryService.php`
- [X] T007 [P] Implement AdminRevenueQueryService with methods `revenueThisMonth()`, `revenueLastMonth()`, `revenueMonthBefore()`, `revenueYearToDate()`, `monthlyRevenueSeries()`, `revenueByPlan()` using SharedDateScope and PlatformScope in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminRevenueQueryService.php`
- [X] T008 [P] Implement AdminEntityPerformanceQueryService with methods `topGrowingAcademies()`, `topGrowingTeachers()`, `academiesWithAttendanceDecline()`, `teachersWithRevenueDecline()`, `entitiesNearLimit()` using SharedDateScope and PlatformScope in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminEntityPerformanceQueryService.php`

**Checkpoint**: Admin query services ready — user story builders can now be implemented in parallel

---

## Phase 3: User Story 1 — Executive Snapshot (Priority: P1) 🎯 MVP

**Goal**: Deliver the top-level executive snapshot showing platform health KPIs: total academies, total teachers, linked students, active/expired subscriptions, revenue this month/year, entities near plan limit.

**Independent Test**: Call the admin report endpoint with default filters — response includes a `summary` section with 8 KPI cards, each containing `key`, `title`, `current_value`, `baseline_value`, `change_pct`, `direction`. All cards return valid values (or zero-state) for an empty database.

### Implementation for User Story 1

- [X] T009 [US1] Implement AdminExecutiveSnapshotBuilder that composes query service outputs into an array of KpiCardResult instances: total academies, total teachers, total linked students, active subscriptions, expired subscriptions, revenue this month, revenue this year, entities near limit, using KpiCardFactory for consistent card formatting in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminExecutiveSnapshotBuilder.php`
- [X] T010 [US1] Implement GenerateAdminReportAction that accepts validated request input, delegates to BuildReportContextAction for filter resolution, authorizes via AdminReportAccessPolicy, executes AdminExecutiveSnapshotBuilder, and assembles the top-level admin report response (meta, applied_filters, summary sections) in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T011 [US1] Create AdminReportResource API resource transforming the full admin report payload into consistent JSON: `meta`, `applied_filters`, `summary` (KPI cards array), empty `sections` and `alerts` placeholders in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`
- [X] T012 [US1] Register admin report API route `GET /api/admin/reports` pointing to a controller action that delegates to GenerateAdminReportAction, protected by admin middleware, in `backend/routes/api.php`

**Checkpoint**: Executive snapshot visible — Admin can see platform health in one screen with 8 KPI cards

---

## Phase 4: User Story 2 — Revenue Trends (Priority: P2)

**Goal**: Deliver the revenue trends section showing: revenue this month, last month, month before last, YTD, 12-month trend sequence, and growth/decline rate.

**Independent Test**: Call the admin report endpoint — response includes a `sections.revenue_trends` object with `current`, `previous`, `change_pct`, `direction`, and a `series` array of monthly buckets. Growth or decline rate is clearly indicated.

### Implementation for User Story 2

- [X] T013 [US2] Implement AdminRevenueTrendBuilder that composes AdminRevenueQueryService outputs into a TrendMetricResult containing 12-month series and summary delta, using TrendCalculationService for comparison logic in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminRevenueTrendBuilder.php`
- [X] T014 [US2] Add revenue trends section to GenerateAdminReportAction by invoking AdminRevenueTrendBuilder and merging result into the report sections payload in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T015 [US2] Update AdminReportResource to include revenue trend section serialization using TrendMetricResource in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`

**Checkpoint**: Revenue trends visible — Admin can see monthly trajectory, growth/decline rate, and 12-month trend

---

## Phase 5: User Story 3 — Subscription Health (Priority: P2)

**Goal**: Deliver the subscription health section showing: active, expired, renewals due soon, newly activated, churned subscriptions, and plan usage distribution.

**Independent Test**: Call the admin report endpoint — response includes a `sections.subscription_health` object with status counts, renewal horizon metrics, churn metrics, and plan usage distribution breakdown.

### Implementation for User Story 3

- [X] T016 [US3] Implement AdminSubscriptionHealthBuilder that composes AdminSubscriptionQueryService outputs into a subscription health section payload with status counts, renewal counts, churn counts, and usage distribution, producing both KPI cards and breakdown rows in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminSubscriptionHealthBuilder.php`
- [X] T017 [US3] Add subscription health section to GenerateAdminReportAction by invoking AdminSubscriptionHealthBuilder and merging result into the report sections payload in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T018 [US3] Update AdminReportResource to include subscription health section serialization in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`

**Checkpoint**: Subscription health visible — Admin can see stability metrics, churn, renewal pipeline, and usage distribution

---

## Phase 6: User Story 4 — Plan Breakdown (Priority: P3)

**Goal**: Deliver the plan breakdown section grouping data by plan: plan name, academies per plan, teachers per plan, linked students, revenue, average usage percentage.

**Independent Test**: Call the admin report endpoint — response includes a `sections.plan_breakdown` object with rows per plan containing all required columns. Usage percentages are calculated correctly.

### Implementation for User Story 4

- [X] T019 [US4] Implement AdminPlanBreakdownBuilder that composes AdminRevenueQueryService and AdminSubscriptionQueryService outputs into a plan-grouped table with columns: plan name, academy count, teacher count, linked students, revenue, average usage %, using BreakdownBuilder for consistent table formatting in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminPlanBreakdownBuilder.php`
- [X] T020 [US4] Add plan breakdown section to GenerateAdminReportAction by invoking AdminPlanBreakdownBuilder and merging result into the report sections payload in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T021 [US4] Update AdminReportResource to include plan breakdown section serialization in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`

**Checkpoint**: Plan breakdown visible — Admin can compare plan performance side by side

---

## Phase 7: User Story 5 — Entity Performance (Priority: P3)

**Goal**: Deliver the entity performance section ranking top/worst contributors: student growth, activity growth, attendance quality, revenue contribution, usage pressure. Includes tables for top academies, top teachers, attendance decline, revenue decline, entities near limit.

**Independent Test**: Call the admin report endpoint — response includes a `sections.entity_performance` object with ranked tables for each category. Growth percentages are calculated using TrendCalculationService.

### Implementation for User Story 5

- [X] T022 [US5] Implement AdminEntityPerformanceBuilder that composes AdminEntityPerformanceQueryService outputs into ranked tables: top growing academies, top growing teachers, academies with attendance decline, teachers with revenue decline, entities near subscription limit, using BreakdownBuilder for table formatting in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminEntityPerformanceBuilder.php`
- [X] T023 [US5] Add entity performance section to GenerateAdminReportAction by invoking AdminEntityPerformanceBuilder and merging result into the report sections payload in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T024 [US5] Update AdminReportResource to include entity performance section serialization in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`

**Checkpoint**: Entity performance visible — Admin can identify top/worst performing entities

---

## Phase 8: User Story 6 — Operational Risk Alerts (Priority: P3)

**Goal**: Deliver the operational risk alerts section surfacing: attendance drop, revenue drop, renewal congestion, inactivity spikes, over-usage. Admin must leave the page knowing where intervention is needed.

**Independent Test**: Call the admin report endpoint — response includes an `alerts` array with ranked alerts. Each alert has `alert_key`, `severity`, `message`, `context`, `source_section`. Alert thresholds trigger correctly based on cross-section metrics.

### Implementation for User Story 6

- [X] T025 [US6] Implement AdminAlertContextBuilder that collects section metrics from executive snapshot, revenue, subscription, and entity performance builders into a context array suitable for AlertEngine evaluation in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminAlertContextBuilder.php`
- [X] T026 [US6] Add alert evaluation to GenerateAdminReportAction by invoking AdminAlertContextBuilder and passing context to AlertEngine, merging ranked AlertResult collection into the report response in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T027 [US6] Update AdminReportResource to include alerts array serialization using AlertResource in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`

**Checkpoint**: Operational risk alerts visible — Admin sees prioritized intervention queue with severity levels

---

## Phase 9: User Story 7 — Detailed Tables / Drill-down (Priority: P4)

**Goal**: Deliver dedicated drill-down endpoints for: academies summary, teachers summary, subscriptions summary, plan performance. Clicking a top-level KPI or alert opens the corresponding detailed breakdown.

**Independent Test**: Call each drill-down endpoint with filters — response returns paginated rows with correct columns. Drill-down descriptors in the main report response correctly link to available drill-down endpoints.

### Implementation for User Story 7

- [X] T028 [P] [US7] Implement AdminAcademySummaryQueryService with methods for paginated academy rows including columns: academy name, linked students, active students, total teachers, attendance rate, plan, usage %, renewal date, growth % in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminAcademySummaryQueryService.php`
- [X] T029 [P] [US7] Implement AdminTeacherSummaryQueryService with methods for paginated teacher rows including columns: teacher name, academy/independent, linked students, active students, attendance rate, monthly revenue, growth %, plan, usage % in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminTeacherSummaryQueryService.php`
- [X] T030 [P] [US7] Implement AdminSubscriptionSummaryQueryService with methods for paginated subscription rows in `backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminSubscriptionSummaryQueryService.php`
- [X] T031 [US7] Implement GenerateAdminDrilldownAction that accepts drilldown_key + filters, validates against DrilldownRegistry, authorizes via AdminReportAccessPolicy, delegates to the appropriate query service, and returns paginated table payload using BreakdownBuilder in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminDrilldownAction.php`
- [X] T032 [US7] Create AdminDrilldownResource API resource transforming drill-down table payload with columns, rows, pagination, and sort metadata in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminDrilldownResource.php`
- [X] T033 [US7] Register admin drill-down API route `GET /api/admin/reports/drilldown/{key}` pointing to a controller action that delegates to GenerateAdminDrilldownAction, protected by admin middleware, in `backend/routes/api.php`
- [X] T034 [US7] Add drill-down descriptors to GenerateAdminReportAction response by collecting available drill-down keys from DrilldownRegistry and including them in the report payload in `backend/app/Domains/Reporting/Application/Actions/Admin/GenerateAdminReportAction.php`
- [X] T035 [US7] Update AdminReportResource to include drilldown descriptors section in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminReportResource.php`

**Checkpoint**: Drill-down endpoints operational — every top-level KPI and alert links to detailed paginated tables

---

## Phase 10: User Story 8 — Export Support (Priority: P4)

**Goal**: Deliver export-ready admin report payload so that the same filter context used on screen is preserved in the export. Flattened blocks: summary KPIs, section breakdowns, detailed rows, applied filters.

**Independent Test**: Call the admin report export endpoint — response returns a flattened payload with `summary_kpis`, `section_breakdowns`, `detailed_rows`, and `applied_filter_metadata` blocks matching the on-screen data.

### Implementation for User Story 8

- [X] T036 [US8] Implement AdminExportBuilder that composes all admin report sections into an ExportPayload using ExportPayloadBuilder, flattening KPI cards, section breakdowns, and detailed drill-down rows with applied filter metadata in `backend/app/Domains/Reporting/Application/Builders/Admin/AdminExportBuilder.php`
- [X] T037 [US8] Implement ExportAdminReportAction that accepts validated request input, delegates to BuildReportContextAction, authorizes via AdminReportAccessPolicy, invokes AdminExportBuilder, and returns export payload in `backend/app/Domains/Reporting/Application/Actions/Admin/ExportAdminReportAction.php`
- [X] T038 [US8] Create AdminExportResource API resource transforming export payload into JSON blocks in `backend/app/Domains/Reporting/Presentation/Resources/Admin/AdminExportResource.php`
- [X] T039 [US8] Register admin report export API route `GET /api/admin/reports/export` pointing to a controller action that delegates to ExportAdminReportAction, protected by admin middleware, in `backend/routes/api.php`

**Checkpoint**: Export endpoint operational — Admin can download report data with full filter context preservation

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Authorization hardening, caching, and integration validation

- [X] T040 [P] Update ReportingServiceProvider to bind AdminReportAccessPolicy when the admin report context is active in `backend/app/Providers/ReportingServiceProvider.php`
- [X] T041 [P] Add PHPDoc type annotations and return type declarations across all new Admin report files for IDE support and static analysis
- [X] T042 Verify that admin report uses the same filter vocabulary as foundation by tracing filter flow from request through ReportFilterNormalizer to SharedDateScope/PlatformScope
- [X] T043 Verify that all trendable admin metrics use TrendCalculationService for comparison logic
- [X] T044 Verify that exported admin reports preserve the same filter context used on screen by tracing through AdminExportBuilder
- [X] T045 Verify that non-admin users are blocked from all admin report endpoints via AdminReportAccessPolicy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **User Stories (Phase 3–10)**: All depend on Phase 2 completion
  - US1 (Phase 3): Can start after Phase 2 — no dependencies on other stories
  - US2 (Phase 4): Depends on US1 (extends GenerateAdminReportAction)
  - US3 (Phase 5): Depends on US1 (extends GenerateAdminReportAction)
  - US4 (Phase 6): Depends on US1 (extends GenerateAdminReportAction)
  - US5 (Phase 7): Depends on US1 (extends GenerateAdminReportAction)
  - US6 (Phase 8): Depends on US2–US5 (collects cross-section metrics)
  - US7 (Phase 9): Depends on US1 (drill-down extends main report)
  - US8 (Phase 10): Depends on US2–US5 (exports all sections)
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) — Executive Snapshot**: No dependencies on other admin stories — MVP
- **US2 (P2) — Revenue Trends**: Extends US1 report action (adds section)
- **US3 (P2) — Subscription Health**: Extends US1 report action (adds section) — parallel with US2
- **US4 (P3) — Plan Breakdown**: Extends US1 report action (adds section) — parallel with US2, US3
- **US5 (P3) — Entity Performance**: Extends US1 report action (adds section) — parallel with US2, US3, US4
- **US6 (P3) — Alerts**: Requires US2–US5 section metrics for cross-section alert context
- **US7 (P4) — Drill-down**: Extends US1 with separate endpoints
- **US8 (P4) — Export**: Requires US2–US5 sections for export completeness

### Within Each User Story

- Query services before builders
- Builders before actions
- Actions before routes/resources
- Core implementation before integration

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel
- **Phase 2**: T004–T008 (all query services) can run in parallel
- **Phase 4–7**: US2, US3, US4, US5 builders can run in parallel (different builder files)
- **Phase 9**: T028, T029, T030 (drill-down query services) can run in parallel
- **Phase 11**: T040, T041 can run in parallel; T042–T045 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all admin query services together:
Task: "T004 Implement AdminStudentActivityQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminStudentActivityQueryService.php"
Task: "T005 Implement AdminEntityQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminEntityQueryService.php"
Task: "T006 Implement AdminSubscriptionQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminSubscriptionQueryService.php"
Task: "T007 Implement AdminRevenueQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminRevenueQueryService.php"
Task: "T008 Implement AdminEntityPerformanceQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminEntityPerformanceQueryService.php"
```

## Parallel Example: User Stories 2–5

```bash
# These builders extend the report action independently — can be built in parallel:
Task: "T013 Implement AdminRevenueTrendBuilder in backend/app/Domains/Reporting/Application/Builders/Admin/AdminRevenueTrendBuilder.php"
Task: "T016 Implement AdminSubscriptionHealthBuilder in backend/app/Domains/Reporting/Application/Builders/Admin/AdminSubscriptionHealthBuilder.php"
Task: "T019 Implement AdminPlanBreakdownBuilder in backend/app/Domains/Reporting/Application/Builders/Admin/AdminPlanBreakdownBuilder.php"
Task: "T022 Implement AdminEntityPerformanceBuilder in backend/app/Domains/Reporting/Application/Builders/Admin/AdminEntityPerformanceBuilder.php"
```

## Parallel Example: Drill-down Query Services

```bash
# Launch all drill-down query services together:
Task: "T028 Implement AdminAcademySummaryQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminAcademySummaryQueryService.php"
Task: "T029 Implement AdminTeacherSummaryQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminTeacherSummaryQueryService.php"
Task: "T030 Implement AdminSubscriptionSummaryQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/Admin/AdminSubscriptionSummaryQueryService.php"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T008) — BLOCKS all stories
3. Complete Phase 3: User Story 1 — Executive Snapshot (T009–T012)
4. **STOP and VALIDATE**: Call `GET /api/admin/reports` and verify 8 KPI cards return with correct values
5. Deploy/demo if ready — Admin can see platform health in one screen

### Incremental Delivery

1. Complete Setup + Foundational (T001–T008) → Query services ready
2. Add US1 (T009–T012) → Executive snapshot working → Validate independently → **MVP**
3. Add US2 (T013–T015) → Revenue trends visible → Validate independently
4. Add US3 (T016–T018) → Subscription health visible → Validate independently
5. Add US4 (T019–T021) → Plan breakdown visible → Validate independently
6. Add US5 (T022–T024) → Entity performance visible → Validate independently
7. Add US6 (T025–T027) → Alerts surfaced → Validate independently
8. Add US7 (T028–T035) → Drill-down tables operational → Validate independently
9. Add US8 (T036–T039) → Export operational → Validate independently
10. Polish (T040–T045) → Cross-cutting validation

### Parallel Team Strategy

With multiple developers after Phase 2 completes:

1. **Developer A**: US1 (Phase 3) — Executive Snapshot + main report action + route
2. After US1 is done:
   - **Developer A**: US2 (Phase 4) — Revenue Trends
   - **Developer B**: US3 (Phase 5) — Subscription Health
   - **Developer C**: US4 (Phase 6) — Plan Breakdown
   - **Developer D**: US5 (Phase 7) — Entity Performance
3. After US2–US5 complete:
   - **Developer A**: US6 (Phase 8) — Alerts
   - **Developer B**: US7 (Phase 9) — Drill-down
4. After US6–US7 complete:
   - **Developer A**: US8 (Phase 10) — Export

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All paths follow existing DDD convention in `backend/app/Domains/Reporting/`
- Admin reports compose over the shared reporting foundation (Spec 001)
- Future specs (Academy, Teacher) reuse the same builders pattern with scoped query services
