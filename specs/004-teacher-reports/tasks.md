# Tasks: Teacher Reports

**Input**: Design documents from `/specs/004-teacher-reports/`
**Prerequisites**: spec.md (required), Reporting Foundation (spec 001) completed
**Tests**: Not explicitly requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/Domains/Reporting/` for reporting domain code
- **Frontend**: `frontend/src/` for Next.js frontend code
- Backend follows existing DDD structure: `Domain/`, `Application/`, `Infrastructure/`, `Presentation/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and shared types for teacher reporting

- [X] T001 Create teacher report component directory at `frontend/src/components/reports/teacher/`
- [X] T002 [P] Create TypeScript types for teacher report data (snapshot KPIs, income trends, student activity, attendance, group breakdown, subscription capacity, alerts, drilldown) in `frontend/src/types/teacher-report.types.ts`
- [X] T003 [P] Create Zod validation schemas for teacher report API responses aligned with reporting foundation contracts in `frontend/src/schemas/teacher-report.schema.ts` aligned with reporting foundation contracts in `frontend/src/schemas/teacher-report.schema.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core teacher scoping, request validation, and access control that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create TeacherReportRequest form request with filter validation (date range preset, comparison mode, group/course filter, student activity state, attendance state) in `backend/app/Domains/Reporting/Presentation/Requests/TeacherReportRequest.php`
- [X] T005 [P] Create TeacherReportAccessPolicy implementing ReportAccessPolicy contract, enforcing teacher can only access own report data in `backend/app/Domains/Reporting/Infrastructure/Policies/TeacherReportAccessPolicy.php`
- [X] T006 [P] Create TeacherScope value object wrapping teacher ID and academy context for query scoping in `backend/app/Domains/Reporting/Domain/ValueObjects/TeacherScope.php`
- [X] T007 Create GenerateTeacherReportAction that accepts validated request, resolves ReportFilters via BuildReportContextAction, applies TeacherScope, and delegates to section builders in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Teacher Snapshot KPIs (Priority: P1) 🎯 MVP

**Goal**: Deliver the top-level KPI snapshot showing Total Linked Students, Active Students, Active Groups/Courses, Attendance Rate, Income This Month, Income Last Month, Year-to-Date Income, and Plan Usage % using KpiCardFactory from the reporting foundation.

**Independent Test**: Given an authenticated teacher with students, groups, sessions, and subscription data, the snapshot endpoint returns 8 KPI cards with correct current values, baseline values, change percentages, and directions. Empty data returns valid zero-state KPIs.

### Backend for User Story 1

- [X] T008 [P] [US1] Implement TeacherStudentQueryService with methods for total linked students count and active students count within reporting period in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherStudentQueryService.php`
- [X] T009 [P] [US1] Implement TeacherIncomeQueryService with methods for current month income, previous month income, and year-to-date income in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherIncomeQueryService.php`
- [X] T010 [P] [US1] Implement TeacherAttendanceQueryService with method for overall attendance rate in selected period in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherAttendanceQueryService.php`
- [X] T011 [P] [US1] Implement TeacherGroupQueryService with method for active groups/courses count in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherGroupQueryService.php`
- [X] T012 [P] [US1] Implement TeacherSubscriptionQueryService with method for plan usage percentage in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherSubscriptionQueryService.php`
- [X] T013 [US1] Implement TeacherSummaryBuilder that composes all query services with KpiCardFactory to produce 8 snapshot KPI cards (total_students, active_students, active_groups, attendance_rate, income_this_month, income_last_month, ytd_income, plan_usage) in `backend/app/Domains/Reporting/Application/Builders/TeacherSummaryBuilder.php`
- [X] T014 [US1] Create TeacherReportResource that formats the full teacher report response (meta, applied_filters, summary KPIs, sections, alerts, drilldowns) in `backend/app/Domains/Reporting/Presentation/Resources/TeacherReportResource.php`
- [X] T015 [US1] Wire GenerateTeacherReportAction to orchestrate TeacherSummaryBuilder and return snapshot section in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`
- [X] T016 [US1] Register new teacher report routes (GET reports/overview, GET reports/drilldown/{key}) in `backend/routes/api/v1/teacher.php`

### Frontend for User Story 1

- [X] T017 [US1] Create API service for teacher report endpoints (fetchOverview, fetchDrilldown) in `frontend/src/services/teacherReportService.ts`
- [X] T018 [P] [US1] Create KpiCard reusable component displaying metric title, value, change %, direction arrow, and optional drilldown link in `frontend/src/components/reports/KpiCard.tsx`
- [X] T019 [US1] Create TeacherSnapshot component rendering the 8 KPI cards in a responsive grid layout in `frontend/src/components/reports/teacher/TeacherSnapshot.tsx`
- [X] T020 [US1] Create ReportFilters component with date range presets, comparison mode selector, and group/course filter using existing Button/Input components in `frontend/src/components/reports/teacher/ReportFilters.tsx`
- [X] T021 [US1] Rebuild teacher reports page integrating ReportFilters, TeacherSnapshot, data fetching, and loading/empty states in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see their snapshot KPIs with comparison data on the reports page

---

## Phase 4: User Story 2 — Income Trends (Priority: P2)

**Goal**: Deliver monthly income trend visualization showing current month, previous month, month before, year-to-date, 12-month trend line, growth/decline rate, and direction (up/down/stable).

**Independent Test**: Given a teacher with payment history, the income trends section returns monthly income buckets with correct amounts, change percentages, and direction indicators. The 12-month chart renders with accurate data points.

### Backend for User Story 2

- [X] T022 [US2] Extend TeacherIncomeQueryService with monthly income bucketing (last 12 months), year-to-date aggregation, and growth rate calculation using TrendCalculationService in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherIncomeQueryService.php`
- [X] T023 [US2] Create TeacherIncomeTrendBuilder producing TrendMetricResult with monthly series and summary delta in `backend/app/Domains/Reporting/Application/Builders/TeacherIncomeTrendBuilder.php`
- [X] T024 [US2] Integrate income trend section into GenerateTeacherReportAction in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

### Frontend for User Story 2

- [X] T025 [US2] Create IncomeTrends component with recharts LineChart for 12-month trend and summary cards for current/previous/YTD income with direction indicators in `frontend/src/components/reports/teacher/IncomeTrends.tsx`
- [X] T026 [P] [US2] Create MonthlyIncomeTable component using DataTable showing month, amount, previous amount, change %, and direction columns in `frontend/src/components/reports/teacher/MonthlyIncomeTable.tsx`
- [X] T027 [US2] Integrate IncomeTrends and MonthlyIncomeTable into teacher reports page in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see income trends with 12-month chart and monthly comparison table

---

## Phase 5: User Story 3 — Student Activity (Priority: P3)

**Goal**: Deliver student activity section showing linked students count, active/inactive breakdown, new students this month, and student activity trend over time.

**Independent Test**: Given a teacher with enrollments, the student activity section returns correct counts and activity trend. Active students are correctly separated from total linked count.

### Backend for User Story 3

- [X] T028 [US3] Extend TeacherStudentQueryService with new students in period count, inactive students count, and monthly student activity trend using TrendCalculationService in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherStudentQueryService.php`
- [X] T029 [US3] Create TeacherStudentActivityBuilder producing KPI cards for student metrics and TrendMetricResult for activity trend in `backend/app/Domains/Reporting/Application/Builders/TeacherStudentActivityBuilder.php`
- [X] T030 [US3] Integrate student activity section into GenerateTeacherReportAction in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

### Frontend for User Story 3

- [X] T031 [US3] Create StudentActivity component showing student count cards (total, active, inactive, new) and activity trend line chart in `frontend/src/components/reports/teacher/StudentActivity.tsx`
- [X] T032 [P] [US3] Create StudentActivityTable component using DataTable with columns: student name, group, activity state, last activity date in `frontend/src/components/reports/teacher/StudentActivityTable.tsx`
- [X] T033 [US3] Integrate StudentActivity and StudentActivityTable into teacher reports page in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see student activity breakdown with trend data

---

## Phase 6: User Story 4 — Attendance Performance (Priority: P4)

**Goal**: Deliver attendance performance section showing overall attendance rate, attendance by group, attendance by session series, best and worst performing groups, and attendance change from previous period.

**Independent Test**: Given a teacher with lecture sessions and attendance records, the attendance section returns correct rates by group, identifies best/worst groups, and shows period-over-period change.

### Backend for User Story 4

- [X] T034 [US4] Extend TeacherAttendanceQueryService with attendance by group, attendance by session series, best/worst group identification, and period-over-period comparison using TrendCalculationService in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherAttendanceQueryService.php`
- [X] T035 [US4] Create TeacherAttendanceBuilder producing per-group attendance KPIs, trend data, and best/worst rankings in `backend/app/Domains/Reporting/Application/Builders/TeacherAttendanceBuilder.php`
- [X] T036 [US4] Integrate attendance performance section into GenerateTeacherReportAction in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

### Frontend for User Story 4

- [X] T037 [US4] Create AttendancePerformance component showing overall rate card, best/worst group highlights, and attendance change indicator in `frontend/src/components/reports/teacher/AttendancePerformance.tsx`
- [X] T038 [P] [US4] Create AttendanceDetailTable component using DataTable with columns: group name, students count, attendance %, sessions, trend in `frontend/src/components/reports/teacher/AttendanceDetailTable.tsx`
- [X] T039 [US4] Integrate AttendancePerformance and AttendanceDetailTable into teacher reports page in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see attendance performance with group-level breakdown

---

## Phase 7: User Story 5 — Group/Course Breakdown (Priority: P5)

**Goal**: Deliver per-group or per-course breakdown showing name, student count, active students, attendance rate, delivered sessions, income contribution, and trend.

**Independent Test**: Given a teacher with multiple groups, the group breakdown section returns each group with all metrics correctly calculated. Income contribution shows proportional attribution.

### Backend for User Story 5

- [X] T040 [US5] Extend TeacherGroupQueryService with per-group metrics (students, active students, attendance rate, delivered sessions, income contribution, trend) in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherGroupQueryService.php`
- [X] T041 [US5] Create TeacherGroupBreakdownBuilder using BreakdownBuilder foundation with group-specific row mapper and table schema in `backend/app/Domains/Reporting/Application/Builders/TeacherGroupBreakdownBuilder.php`
- [X] T042 [US5] Integrate group breakdown section into GenerateTeacherReportAction and register group drill-down in DrilldownRegistry in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

### Frontend for User Story 5

- [X] T043 [US5] Create GroupBreakdown component with DataTable showing group name, students, active students, attendance %, sessions, income, trend arrow in `frontend/src/components/reports/teacher/GroupBreakdown.tsx`
- [X] T044 [US5] Integrate GroupBreakdown into teacher reports page in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see per-group performance breakdown

---

## Phase 8: User Story 6 — Subscription & Capacity (Priority: P6)

**Goal**: Deliver subscription and capacity section showing current plan name, student limit, used slots, remaining capacity, usage percentage, renewal date, and status.

**Independent Test**: Given a teacher with an active subscription, the capacity section shows correct plan details, usage percentage, and remaining capacity. Near-limit status triggers visual indicator.

### Backend for User Story 6

- [X] T045 [US6] Extend TeacherSubscriptionQueryService with full plan details (plan name, student limit, used slots, remaining capacity, usage %, renewal date, status) in `backend/app/Domains/Reporting/Infrastructure/Queries/TeacherSubscriptionQueryService.php`
- [X] T046 [US6] Create TeacherSubscriptionBuilder producing plan details and usage metrics in `backend/app/Domains/Reporting/Application/Builders/TeacherSubscriptionBuilder.php`
- [X] T047 [US6] Integrate subscription section into GenerateTeacherReportAction in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

### Frontend for User Story 6

- [X] T048 [US6] Create SubscriptionCapacity component showing plan details card, usage progress bar, remaining capacity, and renewal countdown in `frontend/src/components/reports/teacher/SubscriptionCapacity.tsx`
- [X] T049 [US6] Integrate SubscriptionCapacity into teacher reports page in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see subscription capacity and plan usage

---

## Phase 9: User Story 7 — Alerts & Recommendations (Priority: P7)

**Goal**: Deliver actionable alerts and recommendations including income drop, poor group attendance, declining student activity, near plan limit, approaching renewal, and disproportionate income risk.

**Independent Test**: Given various data conditions (income drop, poor attendance, near limit), the alert engine produces correctly ranked and severity-scored alerts with actionable messages and drill-down links.

### Backend for User Story 7

- [X] T050 [P] [US7] Create TeacherIncomeDropRule alert rule implementing AlertRule contract, evaluating teacher income decline with configurable threshold in `backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherIncomeDropRule.php`
- [X] T051 [P] [US7] Create TeacherAttendanceDropRule alert rule evaluating poor group attendance against threshold in `backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherAttendanceDropRule.php`
- [X] T052 [P] [US7] Create TeacherStudentInactivityRule alert rule evaluating declining student activity trend in `backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherStudentInactivityRule.php`
- [X] T053 [P] [US7] Create TeacherNearPlanLimitRule alert rule evaluating plan capacity pressure in `backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherNearPlanLimitRule.php`
- [X] T054 [P] [US7] Create TeacherRenewalApproachingRule alert rule evaluating upcoming subscription renewal within configurable days in `backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherRenewalApproachingRule.php`
- [X] T055 [P] [US7] Create TeacherIncomeConcentrationRule alert rule evaluating disproportionate group income risk in `backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherIncomeConcentrationRule.php`
- [X] T056 [US7] Create TeacherAlertEngine extending AlertEngine with teacher-specific ordered rules and context assembly in `backend/app/Domains/Reporting/Domain/Services/TeacherAlertEngine.php`
- [X] T057 [US7] Integrate TeacherAlertEngine into GenerateTeacherReportAction to produce alerts section in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherReportAction.php`

### Frontend for User Story 7

- [X] T058 [US7] Create AlertsRecommendations component rendering prioritized alert cards with severity badges (info/warning/critical), messages, and drill-down action links in `frontend/src/components/reports/teacher/AlertsRecommendations.tsx`
- [X] T059 [US7] Integrate AlertsRecommendations into teacher reports page in `frontend/src/app/teacher/reports/page.tsx`

**Checkpoint**: Teacher can see actionable alerts and recommendations

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Drill-down support, loading states, and cross-section filter persistence

- [X] T060 [P] Implement GenerateTeacherDrilldownAction handling drill-down requests for income detail, attendance by group, student list, subscription detail, and group performance in `backend/app/Domains/Reporting/Application/Actions/GenerateTeacherDrilldownAction.php`
- [X] T061 [P] Register drill-down route in `backend/routes/api/v1/teacher.php`
- [X] T062 [P] Create DrilldownTable component rendering dynamic table based on schema from drill-down descriptor using existing DataTable in `frontend/src/components/reports/DrilldownTable.tsx`
- [X] T063 [P] Create ReportSkeletons component with loading skeleton placeholders for all report sections in `frontend/src/components/reports/teacher/ReportSkeletons.tsx`
- [X] T064 Update frontend types and Zod schemas to cover all report sections and drill-down responses in `frontend/src/types/teacher-report.types.ts` and `frontend/src/schemas/teacher-report.schema.ts`
- [X] T065 Verify filter persistence across all sections and drill-down navigation, add filter state sync in `frontend/src/app/teacher/reports/page.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–9)**: All depend on Foundational phase completion
  - US1 (Phase 3): Can start after Phase 2 — no dependencies on other stories
  - US2 (Phase 4): Extends US1's TeacherIncomeQueryService
  - US3 (Phase 5): Extends US1's TeacherStudentQueryService
  - US4 (Phase 6): Extends US1's TeacherAttendanceQueryService
  - US5 (Phase 7): Extends US1's TeacherGroupQueryService, uses US4 attendance data
  - US6 (Phase 8): Extends US1's TeacherSubscriptionQueryService
  - US7 (Phase 9): Reads data produced by US1–US6
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) — Snapshot KPIs**: No dependencies on other stories (foundational MVP)
- **US2 (P2) — Income Trends**: Extends US1's TeacherIncomeQueryService
- **US3 (P3) — Student Activity**: Extends US1's TeacherStudentQueryService
- **US4 (P4) — Attendance Performance**: Extends US1's TeacherAttendanceQueryService
- **US5 (P5) — Group Breakdown**: Uses US1's TeacherGroupQueryService + US4's attendance data
- **US6 (P6) — Subscription**: Extends US1's TeacherSubscriptionQueryService
- **US7 (P7) — Alerts**: Reads data produced by US1–US6

### Within Each User Story

- Query services before builders
- Builders before action integration
- Backend endpoint before frontend service
- Frontend components before page integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T003 (types and schemas) can run in parallel
- **Phase 2**: T004, T005, T006 can run in parallel; T007 depends on T004–T006
- **Phase 3 (US1)**: T008–T012 (all 5 query services) can run in parallel; T018–T020 (frontend components) can run in parallel
- **Phase 4 (US2)**: T025, T026 (frontend components) can run in parallel
- **Phase 5 (US3)**: T031, T032 (frontend components) can run in parallel
- **Phase 6 (US4)**: T037, T038 (frontend components) can run in parallel
- **Phase 7 (US5)**: No parallel within story (sequential extension)
- **Phase 8 (US6)**: No parallel within story
- **Phase 9 (US7)**: T050–T055 (all 6 alert rules) can run in parallel
- **Phase 10**: T060–T063 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all query services together:
Task: "T008 Implement TeacherStudentQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/TeacherStudentQueryService.php"
Task: "T009 Implement TeacherIncomeQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/TeacherIncomeQueryService.php"
Task: "T010 Implement TeacherAttendanceQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/TeacherAttendanceQueryService.php"
Task: "T011 Implement TeacherGroupQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/TeacherGroupQueryService.php"
Task: "T012 Implement TeacherSubscriptionQueryService in backend/app/Domains/Reporting/Infrastructure/Queries/TeacherSubscriptionQueryService.php"

# Launch frontend components together:
Task: "T018 Create KpiCard in frontend/src/components/reports/KpiCard.tsx"
Task: "T019 Create TeacherSnapshot in frontend/src/components/reports/teacher/TeacherSnapshot.tsx"
Task: "T020 Create ReportFilters in frontend/src/components/reports/teacher/ReportFilters.tsx"
```

## Parallel Example: User Story 7 (Alerts)

```bash
# Launch all alert rules together:
Task: "T050 Create TeacherIncomeDropRule in backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherIncomeDropRule.php"
Task: "T051 Create TeacherAttendanceDropRule in backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherAttendanceDropRule.php"
Task: "T052 Create TeacherStudentInactivityRule in backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherStudentInactivityRule.php"
Task: "T053 Create TeacherNearPlanLimitRule in backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherNearPlanLimitRule.php"
Task: "T054 Create TeacherRenewalApproachingRule in backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherRenewalApproachingRule.php"
Task: "T055 Create TeacherIncomeConcentrationRule in backend/app/Domains/Reporting/Domain/Services/AlertRules/TeacherIncomeConcentrationRule.php"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T007)
3. Complete Phase 3: User Story 1 — Teacher Snapshot (T008–T021)
4. **STOP and VALIDATE**: Test that teacher snapshot shows all 8 KPIs with correct values and comparison data
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (T001–T007) → Foundation ready
2. Add US1 (T008–T021) → Teacher Snapshot working → Validate independently (MVP!)
3. Add US2 (T022–T027) → Income Trends working → Validate independently
4. Add US3 (T028–T033) → Student Activity working → Validate independently
5. Add US4 (T034–T039) → Attendance Performance working → Validate independently
6. Add US5 (T040–T044) → Group Breakdown working → Validate independently
7. Add US6 (T045–T049) → Subscription Capacity working → Validate independently
8. Add US7 (T050–T059) → Alerts working → Validate independently
9. Polish (T060–T065) → Drill-down, skeletons, filter persistence
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Phase 2 completes:

1. Team completes Setup + Foundational together
2. Developer A: US1 (Phase 3) — must go first as other stories extend its query services
3. Once US1 query services exist:
   - Developer A: US2 (Income Trends) + US6 (Subscription)
   - Developer B: US3 (Student Activity) + US5 (Group Breakdown)
   - Developer C: US4 (Attendance Performance) + US7 (Alerts)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All backend code uses Reporting domain shared primitives (KpiCardFactory, TrendCalculationService, AlertEngine, BreakdownBuilder, DrilldownRegistry)
- Frontend uses existing components (DashboardCard, DataTable) and recharts for charts
- The existing teacher report (TeacherReportController + ReportService) remains untouched; new reporting uses the Reporting domain
- Filters apply across all sections and persist during drill-down navigation
- Arabic (RTL) UI conventions followed in all frontend components
