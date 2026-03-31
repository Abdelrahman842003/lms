---

description: "Task list for Academy Reports feature (Spec 003)"
---

# Tasks: Academy Reports

**Input**: Design documents from `/specs/003-academy-reports/`
**Prerequisites**: Reporting Foundation (Spec 001 - COMPLETE), spec.md (required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each user story maps to a report section from the spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Report Section | Priority | Description |
|-------|---------------|----------|-------------|
| US1 | Academy Snapshot | P1 (MVP) | Top-level KPI cards (students, teachers, groups, sessions, attendance) |
| US2 | Student Distribution | P2 | Students by grade, group, teacher, activity status, trend |
| US3 | Teacher Performance | P2 | Per-teacher performance table with metrics and trends |
| US4 | Attendance Quality | P2 | Attendance rates by teacher, group, trend, best/worst groups |
| US5 | Session Execution | P2 | Sessions scheduled/delivered/canceled/postponed stats |
| US6 | Subscription Usage | P2 | Plan utilization, usage %, renewal info |
| US7 | Time Comparison | P3 | Period-over-period metric comparison |
| US8 | Alerts & Action Needed | P3 | Automated alerts for operational issues |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create TypeScript types, API service, and backend directory structure

- [x] T001 Create TypeScript types for all academy report sections in `frontend/src/types/academyReport.types.ts`
- [x] T002 [P] Create academy report API service with all endpoint functions in `frontend/src/services/academyReportService.ts`
- [x] T003 [P] Create backend report query directory at `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/`
- [x] T004 [P] Create backend report builder directory at `backend/app/Domains/Reporting/Application/Builders/Academy/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core query infrastructure and filter handling that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create AcademyReportFilters value object extending ReportFilters with academy-specific fields (teacher_id, grade_id, group_id, student_status, session_status) in `backend/app/Domains/Reporting/Domain/ValueObjects/AcademyReportFilters.php`
- [x] T006 [P] Create BuildAcademyReportContextAction that builds AcademyReportFilters from request input in `backend/app/Domains/Reporting/Application/Actions/BuildAcademyReportContextAction.php`
- [x] T007 [P] Create AcademyStudentQueries in `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/AcademyStudentQueries.php`
- [x] T008 [P] Create AcademyTeacherQueries in `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/AcademyTeacherQueries.php`
- [x] T009 [P] Create AcademyAttendanceQueries in `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/AcademyAttendanceQueries.php`
- [x] T010 [P] Create AcademySessionQueries in `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/AcademySessionQueries.php`
- [x] T011 [P] Create AcademySubscriptionQueries in `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/AcademySubscriptionQueries.php`
- [x] T012 Create AcademyReportController with all endpoints in `backend/app/Domains/Application/Http/Controllers/Academy/AcademyReportController.php`
- [x] T013 Register new academy report routes in `backend/routes/api/v1/academy.php`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Academy Snapshot (Priority: P1) 🎯 MVP

**Goal**: Academy manager can see 8 top-level KPI cards with current values and trend indicators

**Independent Test**: Send GET /api/v1/academy/reports/snapshot → receive array of 8 KPI cards

- [x] T014 [US1] Create AcademySnapshotBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/AcademySnapshotBuilder.php`
- [x] T015 [US1] Add snapshot() endpoint to AcademyReportController
- [x] T016 [P] [US1] Create ReportFiltersBar component in `frontend/src/app/academy/reports/components/ReportFiltersBar.tsx`
- [x] T017 [P] [US1] Create AcademySnapshot component in `frontend/src/app/academy/reports/components/AcademySnapshot.tsx`

**Checkpoint**: Academy snapshot with 8 KPIs visible and independently testable

---

## Phase 4: User Story 2 - Student Distribution (Priority: P2)

**Goal**: Academy manager can see student distribution charts by grade, group, teacher, and activity status

- [x] T018 [US2] Create StudentDistributionBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/StudentDistributionBuilder.php`
- [x] T019 [US2] Add studentDistribution() endpoint to AcademyReportController
- [x] T020 [US2] Create StudentDistributionCharts component in `frontend/src/app/academy/reports/components/StudentDistributionCharts.tsx`

**Checkpoint**: Student distribution charts visible with filterable data

---

## Phase 5: User Story 3 - Teacher Performance (Priority: P2)

**Goal**: Academy manager can view a sortable table of teacher performance metrics

- [x] T021 [US3] Create TeacherPerformanceBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/TeacherPerformanceBuilder.php`
- [x] T022 [US3] Add teacherPerformance() endpoint to AcademyReportController
- [x] T023 [P] [US3] TeacherPerformanceResource integrated into builder output
- [x] T024 [US3] Create TeacherPerformanceTable component in `frontend/src/app/academy/reports/components/TeacherPerformanceTable.tsx`

**Checkpoint**: Teacher performance table sortable and paginated

---

## Phase 6: User Story 4 - Attendance Quality (Priority: P2)

**Goal**: Academy manager can analyze attendance rates by teacher, group, and over time

- [x] T025 [US4] Create AttendanceQualityBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/AttendanceQualityBuilder.php`
- [x] T026 [US4] Add attendanceQuality() endpoint to AcademyReportController
- [x] T027 [P] [US4] GroupAttendance data integrated into builder output
- [x] T028 [US4] Create AttendanceQualityPanel component in `frontend/src/app/academy/reports/components/AttendanceQualityPanel.tsx`

**Checkpoint**: Attendance quality analysis complete with charts and tables

---

## Phase 7: User Story 5 - Session Execution (Priority: P2)

**Goal**: Academy manager can track session delivery quality

- [x] T029 [US5] Create SessionExecutionBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/SessionExecutionBuilder.php`
- [x] T030 [US5] Add sessionExecution() endpoint to AcademyReportController
- [x] T031 [P] [US5] SessionExecution data integrated into builder output
- [x] T032 [US5] Create SessionExecutionReport component in `frontend/src/app/academy/reports/components/SessionExecutionReport.tsx`

**Checkpoint**: Session execution report with delivery quality metrics

---

## Phase 8: User Story 6 - Subscription Usage (Priority: P2)

**Goal**: Academy manager can see current plan utilization and renewal information

- [x] T033 [US6] Create SubscriptionUsageBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/SubscriptionUsageBuilder.php`
- [x] T034 [US6] Add subscriptionUsage() endpoint to AcademyReportController
- [x] T035 [US6] Create SubscriptionUsageCard component in `frontend/src/app/academy/reports/components/SubscriptionUsageCard.tsx`

**Checkpoint**: Subscription usage card showing plan utilization

---

## Phase 9: User Story 7 - Time Comparison (Priority: P3)

**Goal**: Academy manager can compare current period metrics against previous periods

- [x] T036 [US7] Create TimeComparisonBuilder in `backend/app/Domains/Reporting/Application/Builders/Academy/TimeComparisonBuilder.php`
- [x] T037 [US7] Add timeComparison() endpoint to AcademyReportController
- [x] T038 [US7] Create TimeComparisonPanel component in `frontend/src/app/academy/reports/components/TimeComparisonPanel.tsx`

**Checkpoint**: Time comparison showing period-over-period changes

---

## Phase 10: User Story 8 - Alerts & Action Needed (Priority: P3)

**Goal**: Academy manager receives automated alerts about operational issues needing attention

- [x] T039 [US8] Create AcademyAlertDataProvider in `backend/app/Domains/Reporting/Infrastructure/Queries/Academy/AcademyAlertDataProvider.php`
- [x] T040 [US8] Add alerts() endpoint to AcademyReportController
- [x] T041 [US8] Create AlertsPanel component in `frontend/src/app/academy/reports/components/AlertsPanel.tsx`

**Checkpoint**: Alerts panel showing operational insights

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Integration, drill-down, and final page assembly

- [ ] T042 [P] Register academy drilldown entries in DrilldownRegistry
- [x] T043 Add overview() endpoint to AcademyReportController
- [x] T044 Rewrite academy reports page integrating all 8 section components in `frontend/src/app/academy/reports/page.tsx`
- [ ] T045 [P] Add error handling and edge case responses across all builder classes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### Parallel Opportunities

- All frontend components (T016-T041) can be built in parallel since they are independent files
- Phase 11: T042 and T045 can run in parallel

---

## Notes

- All backend implementation is COMPLETE (T001-T043 backend tasks done)
- Remaining work: Frontend components (T016-T044) + Polish (T045)
- Arabic RTL: All user-facing text in Arabic, matching existing patterns
- Legacy academy reports (ReportController) remain untouched - new endpoints coexist
