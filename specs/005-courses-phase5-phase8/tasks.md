# Tasks: Course System Phase 5, Phase 6, Phase 7, and Phase 8

**Input**: Design documents from `/specs/005-courses-phase5-phase8/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `checklists/requirements.md`

**Tests**: Included because phase-specific testing is explicitly required in `plan.md` section "Testing Strategy (minimal + mandatory)".

**Organization**: Tasks are grouped by user story to allow independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no blocking dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`)
- Each task includes an exact target file path

## Path Conventions

- Backend/Laravel: `backend/`
- Frontend/Next.js: `frontend/`
- Readiness artifacts: `specs/005-courses-phase5-phase8/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare execution artifacts and integration scaffolding reused by all stories.

- [ ] T001 Create phase execution tracker in `specs/005-courses-phase5-phase8/README.md`
- [ ] T002 Create readiness evidence skeleton in `specs/005-courses-phase5-phase8/readiness-report.md`
- [ ] T003 [P] Create FR/SC traceability matrix skeleton in `specs/005-courses-phase5-phase8/traceability-matrix.md`
- [ ] T004 [P] Create end-to-end reliability checklist in `specs/005-courses-phase5-phase8/reliability-checklist.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts for state, access sessions, rewards, and notifications needed before story work.

**⚠️ CRITICAL**: User story implementation starts only after this phase is complete.

- [ ] T005 Create shared course view-state contracts in `frontend/src/features/courses/types/courseViewState.ts`
- [ ] T006 [P] Create protected access session DTOs and enums in `backend/app/Domains/Courses/DTOs/ProtectedContentAccessSessionData.php`
- [ ] T007 [P] Create reward milestone enum and uniqueness key helpers in `backend/app/Domains/Gamification/Enums/CourseRewardMilestone.php`
- [ ] T008 [P] Create notification event routing map constants in `backend/app/Domains/Notifications/Courses/CourseNotificationRoutingMap.php`
- [ ] T009 Create shared audit decision codes for content access in `backend/app/Domains/Courses/Enums/ContentAccessDecision.php`
- [ ] T010 Wire phase 5–8 readiness sections in `specs/005-courses-phase5-phase8/readiness-report.md`

**Checkpoint**: Shared foundations complete; user stories can proceed.

---

## Phase 3: User Story 1 - Student Course Learning Experience (Priority: P1) 🎯 MVP

**Goal**: Deliver student course list/details with locked/current/completed states, sequential locking, and accurate progress reflection.

**Independent Test**: Student sees only authorized courses, blocked lessons stay inaccessible, and progress updates reflect after valid learning actions.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add student course list authorization tests in `backend/tests/Feature/Courses/StudentCourseListAuthorizationTest.php`
- [ ] T012 [P] [US1] Add student course details state rendering tests in `backend/tests/Feature/Courses/StudentCourseDetailStateTest.php`
- [ ] T013 [P] [US1] Add sequential lock enforcement tests in `backend/tests/Feature/Courses/StudentCourseSequentialLockTest.php`
- [ ] T014 [P] [US1] Add progress accuracy tests after lesson actions in `backend/tests/Feature/Courses/StudentCourseProgressAccuracyTest.php`
- [ ] T015 [US1] Add assessment precondition access tests in `backend/tests/Feature/Courses/StudentCourseAssessmentPreconditionsTest.php`
- [ ] T016 [P] [US1] Add frontend student course list component tests in `frontend/src/__tests__/student/courses/student-course-list.test.tsx`
- [ ] T017 [US1] Add frontend student course detail state tests in `frontend/src/__tests__/student/courses/student-course-detail-states.test.tsx`

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement student course projection/query service in `backend/app/Domains/Courses/Services/StudentCourseViewService.php`
- [ ] T019 [P] [US1] Implement sequential gate decision service for student lesson entry in `backend/app/Domains/Courses/Services/StudentCourseSequencingService.php`
- [ ] T020 [P] [US1] Implement assessment prerequisite guard service in `backend/app/Domains/Courses/Services/CourseAssessmentAccessService.php`
- [ ] T021 [US1] Implement student course API controller (`list`, `details`, `progress`) in `backend/app/Http/Controllers/Api/Courses/StudentCourseController.php`
- [ ] T022 [US1] Implement lesson action API controller (`start`, `complete`) in `backend/app/Http/Controllers/Api/Courses/StudentCourseLessonController.php`
- [ ] T023 [US1] Implement student course list page in `frontend/src/app/student/courses/page.tsx`
- [ ] T024 [US1] Implement student course details page with state badges in `frontend/src/app/student/courses/[id]/page.tsx`
- [ ] T025 [P] [US1] Implement shared lesson state UI component (`locked/current/completed`) in `frontend/src/features/courses/components/StudentLessonStateBadge.tsx`
- [ ] T026 [US1] Implement frontend course progress synchronization hook in `frontend/src/features/courses/hooks/useStudentCourseProgress.ts`

**Checkpoint**: US1 is independently testable and deployable as MVP.

---

## Phase 4: User Story 2 - Protected Content Access and Compliance (Priority: P2)

**Goal**: Enforce short-lived private document access, deny unauthorized attempts, and maintain complete audit trails.

**Independent Test**: Authorized requests succeed within validity window; unauthorized/expired requests are denied and logged with required security fields.

### Tests for User Story 2

- [ ] T027 [P] [US2] Add authorized document access window tests in `backend/tests/Feature/Courses/CourseDocumentAccessWindowTest.php`
- [ ] T028 [P] [US2] Add expired and unauthorized denial tests in `backend/tests/Feature/Courses/CourseDocumentUnauthorizedAccessTest.php`
- [ ] T029 [P] [US2] Add replay/cross-device misuse tests in `backend/tests/Feature/Courses/CourseDocumentReplayProtectionTest.php`
- [ ] T030 [US2] Add content access audit completeness tests in `backend/tests/Feature/Courses/CourseContentAccessAuditTest.php`

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement protected document session issuance service in `backend/app/Domains/Courses/Services/ProtectedDocumentSessionService.php`
- [ ] T032 [P] [US2] Implement document access authorization middleware/guard in `backend/app/Http/Middleware/AuthorizeCourseDocumentAccess.php`
- [ ] T033 [P] [US2] Implement content access audit writer service in `backend/app/Domains/Courses/Services/ContentAccessAuditService.php`
- [ ] T034 [US2] Create content access audit migration/indexes in `backend/database/migrations/2026_04_08_003000_create_course_content_access_audits_table.php`
- [ ] T035 [US2] Implement protected document access API controller in `backend/app/Http/Controllers/Api/Courses/CourseDocumentAccessController.php`
- [ ] T036 [US2] Wire protected document routes and access middleware in `backend/routes/api/courses.php`
- [ ] T037 [US2] Implement frontend protected document viewer session handler in `frontend/src/features/courses/document/useProtectedDocumentSession.ts`

**Checkpoint**: US2 is independently testable with policy enforcement and auditability.

---

## Phase 5: User Story 3 - Reward and Notification Engagement Loop (Priority: P3)

**Goal**: Deliver duplicate-safe reward milestones and idempotent multi-channel notifications with correct recipient routing.

**Independent Test**: Eligible milestones produce exactly one transaction, and notification events reach intended audience without duplicate sends.

### Tests for User Story 3

- [ ] T038 [P] [US3] Add reward milestone mapping tests for all course milestones in `backend/tests/Feature/Gamification/CourseRewardMilestoneMappingTest.php`
- [ ] T039 [P] [US3] Add reward idempotency duplicate-event tests in `backend/tests/Feature/Gamification/CourseRewardIdempotencyTest.php`
- [ ] T040 [P] [US3] Add reward concurrency safety tests in `backend/tests/Feature/Gamification/CourseRewardConcurrencyTest.php`
- [ ] T041 [P] [US3] Add notification event-to-template mapping tests in `backend/tests/Feature/Notifications/CourseNotificationEventMappingTest.php`
- [ ] T042 [P] [US3] Add recipient routing correctness tests (student/guardian/teacher) in `backend/tests/Feature/Notifications/CourseNotificationRoutingTest.php`
- [ ] T043 [US3] Add retry idempotency no-duplicate send tests in `backend/tests/Feature/Notifications/CourseNotificationIdempotencyTest.php`

### Implementation for User Story 3

- [ ] T044 [P] [US3] Implement course reward rules resolver service in `backend/app/Domains/Gamification/Services/CourseRewardRuleService.php`
- [ ] T045 [P] [US3] Implement duplicate-safe reward transaction writer in `backend/app/Domains/Gamification/Services/CourseRewardTransactionService.php`
- [ ] T046 [US3] Create reward transaction uniqueness migration/update in `backend/database/migrations/2026_04_08_004000_add_course_reward_uniqueness_constraints.php`
- [ ] T047 [P] [US3] Implement normalized course notification event builder in `backend/app/Domains/Notifications/Courses/CourseNotificationEventBuilder.php`
- [ ] T048 [US3] Implement course notification dispatcher (realtime + push + queue) in `backend/app/Domains/Notifications/Courses/CourseNotificationDispatcher.php`
- [ ] T049 [US3] Implement notification delivery dedup/idempotency service in `backend/app/Domains/Notifications/Courses/CourseNotificationIdempotencyService.php`
- [ ] T050 [US3] Implement listeners for lesson/level/course/points/inactivity events in `backend/app/Listeners/Courses/CourseNotificationListeners.php`
- [ ] T051 [US3] Implement course reward strategy integration in `backend/app/Domains/Gamification/Strategies/CoursePointStrategy.php`

**Checkpoint**: US3 is independently testable for rewards + notifications behavior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize reliability checks, readiness evidence, and architecture documentation.

- [ ] T052 [P] Add end-to-end chain tests (lesson completion → progress → reward → notification) in `backend/tests/Feature/Courses/CourseEndToEndFlowReliabilityTest.php`
- [ ] T053 [P] Add inactivity reminder race-condition tests in `backend/tests/Feature/Notifications/CourseInactivityReminderRaceTest.php`
- [ ] T054 Update SC evidence and verification outcomes in `specs/005-courses-phase5-phase8/readiness-report.md`
- [ ] T055 [P] Complete FR→implementation mapping in `specs/005-courses-phase5-phase8/traceability-matrix.md`
- [ ] T056 Update architecture notes for phase 5–8 implementation in `docs/ARCHITECTURE.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and reuses US1 course access context.
- **Phase 5 (US3)**: Depends on Phase 2 and consumes stable progress/lifecycle events from US1/US2.
- **Phase 6 (Polish)**: Depends on completion of US1, US2, and US3.

### User Story Dependencies

- **US1 (P1)**: Can start after foundational phase; establishes student-facing behavior.
- **US2 (P2)**: Can start after foundational phase; integrates with access policies from US1.
- **US3 (P3)**: Depends on event stability from US1 and security-grade audit context from US2.

### Within Each User Story

- Tests first; verify failing baseline before implementation.
- Backend services before API controllers.
- API endpoints before frontend integration hooks/pages.
- Evidence artifacts updated after story validation.

### Parallel Opportunities

- Setup tasks `T003` and `T004` can run in parallel.
- Foundational tasks `T006`, `T007`, and `T008` can run in parallel.
- US1 backend tests `T011`–`T014` can run in parallel.
- US1 service tasks `T018`–`T020` can run in parallel.
- US2 tests `T027`–`T029` can run in parallel.
- US3 tests `T038`–`T042` can run in parallel.
- US3 implementation tasks `T044`, `T045`, and `T047` can run in parallel.

---

## Parallel Example: User Story 3

- Run in parallel:
  - `T038` in `backend/tests/Feature/Gamification/CourseRewardMilestoneMappingTest.php`
  - `T039` in `backend/tests/Feature/Gamification/CourseRewardIdempotencyTest.php`
  - `T041` in `backend/tests/Feature/Notifications/CourseNotificationEventMappingTest.php`
- Then continue with:
  - `T044`–`T049` reward + notification services
  - `T050`–`T051` event/listener integration

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 student list/details + sequential locks + progress reflection.
3. Validate US1 tests and student workflow behavior.
4. Demo learner experience as first increment.

### Incremental Delivery

1. Ship US1 learner experience.
2. Add US2 protected content compliance controls.
3. Add US3 rewards + notifications engagement loop.
4. Complete polish with reliability evidence and docs.

### Parallel Team Strategy

1. Student experience stream handles US1.
2. Security/compliance stream handles US2.
3. Engagement stream handles US3 once shared event contracts stabilize.

---

## Notes

- All tasks follow strict checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- Story labels appear only in user-story phases.
- Scope remains limited to Phase 5, Phase 6, Phase 7, and Phase 8 deliverables (`FR-016`).
