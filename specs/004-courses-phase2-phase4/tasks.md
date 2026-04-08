# Tasks: Course System Phase 2, Phase 3, and Phase 4

**Input**: Design documents from `/specs/004-courses-phase2-phase4/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `checklists/requirements.md`

**Tests**: Included because behavior, governance, dashboard, and reliability testing are explicitly required in `plan.md` section "Testing Strategy (minimal + mandatory)".

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no direct dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`)
- Every task includes an exact file path

## Path Conventions

- Backend/Laravel: `backend/`
- Frontend/Next.js: `frontend/`
- Spec readiness artifacts: `specs/004-courses-phase2-phase4/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare common artifacts and structural wiring used by all stories.

- [ ] T001 Create execution tracker for Phase 2–4 in `specs/004-courses-phase2-phase4/README.md`
- [ ] T002 Create readiness report template in `specs/004-courses-phase2-phase4/readiness-report.md`
- [ ] T003 [P] Create FR/SC traceability matrix template in `specs/004-courses-phase2-phase4/traceability-matrix.md`
- [ ] T004 [P] Create API and UI verification checklist in `specs/004-courses-phase2-phase4/verification-checklist.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and shared infrastructure that all user stories depend on.

**⚠️ CRITICAL**: User story implementation begins only after this phase is complete.

- [ ] T005 Create course domain enums (`CourseStatus`, `LessonType`, progress statuses) in `backend/app/Domains/Courses/Enums/CourseDomainEnums.php`
- [ ] T006 [P] Create domain exception classes for lifecycle/access/ordering failures in `backend/app/Domains/Courses/Exceptions/CourseDomainException.php`
- [ ] T007 [P] Create shared ordering utility for levels/lessons in `backend/app/Domains/Courses/Support/CourseOrdering.php`
- [ ] T008 Create route registration file for course APIs in `backend/routes/api/courses.php`
- [ ] T009 Wire course API routes in `backend/routes/api.php`
- [ ] T010 Create shared frontend course API client wrapper in `frontend/src/lib/api/courses.ts`

**Checkpoint**: Shared contracts ready; story work can proceed in priority order.

---

## Phase 3: User Story 1 - Create and Govern Course Lifecycle (Priority: P1) 🎯 MVP

**Goal**: Deliver lifecycle, structure management, access/sequencing, and progress behavior for owner workflows.

**Independent Test**: Owner can create/edit/publish/archive course with ordered levels/lessons and consistent sequencing/progress behavior.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add lifecycle transition validity tests in `backend/tests/Feature/Courses/CourseLifecycleTransitionTest.php`
- [ ] T012 [P] [US1] Add structure CRUD and reorder integrity tests in `backend/tests/Feature/Courses/CourseStructureManagementTest.php`
- [ ] T013 [P] [US1] Add lesson type validation tests for video/document/assessment in `backend/tests/Feature/Courses/CourseLessonTypeValidationTest.php`
- [ ] T014 [P] [US1] Add sequencing lock and entitlement decision tests in `backend/tests/Feature/Courses/CourseAccessSequencingTest.php`
- [ ] T015 [US1] Add progress cascade and idempotency tests in `backend/tests/Feature/Courses/CourseProgressEngineTest.php`
- [ ] T016 [US1] Add protected document access authorization tests in `backend/tests/Feature/Courses/CourseProtectedDocumentAccessTest.php`
- [ ] T017 [US1] Add event publication tests for lifecycle/progress events in `backend/tests/Feature/Courses/CourseEventPublicationTest.php`

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement lifecycle service (create/update/publish/archive guards) in `backend/app/Domains/Courses/Services/CourseLifecycleService.php`
- [ ] T019 [P] [US1] Implement structure service for levels/lessons CRUD/reorder in `backend/app/Domains/Courses/Services/CourseStructureService.php`
- [ ] T020 [P] [US1] Implement access and sequencing decision service in `backend/app/Domains/Courses/Services/CourseAccessDecisionService.php`
- [ ] T021 [P] [US1] Implement progress state engine and cascade logic in `backend/app/Domains/Courses/Services/CourseProgressStateService.php`
- [ ] T022 [US1] Implement protected document session flow in `backend/app/Domains/Courses/Services/CourseDocumentAccessService.php`
- [ ] T023 [US1] Implement owner lifecycle/structure API controller in `backend/app/Http/Controllers/Api/Courses/CourseOwnerController.php`
- [ ] T024 [US1] Implement levels/lessons API controller endpoints in `backend/app/Http/Controllers/Api/Courses/CourseStructureController.php`
- [ ] T025 [US1] Implement learner progress/reporting API endpoint for owners in `backend/app/Http/Controllers/Api/Courses/CourseOwnerReportingController.php`
- [ ] T026 [US1] Implement course event dispatchers (`CoursePublished`, `LessonCompleted`, `LevelCompleted`, `CourseCompleted`) in `backend/app/Domains/Courses/Events/CourseDomainEvents.php`
- [ ] T027 [US1] Add API resource transformers for lifecycle/structure/progress responses in `backend/app/Http/Resources/Courses/CourseResource.php`

**Checkpoint**: US1 is independently functional and testable as MVP.

---

## Phase 4: User Story 2 - Admin Oversight and Governance (Priority: P2)

**Goal**: Provide centralized admin visibility, filtering, moderation actions, auditability, and indicators.

**Independent Test**: Admin can list/filter/details courses and apply moderation actions with auditable, consistent outcomes.

### Tests for User Story 2

- [ ] T028 [P] [US2] Add admin list/filter/details coverage tests in `backend/tests/Feature/Courses/AdminCourseRegistryTest.php`
- [ ] T029 [P] [US2] Add moderation action and audit verification tests in `backend/tests/Feature/Courses/AdminCourseModerationTest.php`
- [ ] T030 [US2] Add indicator correctness tests across filters in `backend/tests/Feature/Courses/AdminCourseIndicatorsTest.php`

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement admin course governance service in `backend/app/Domains/Courses/Services/AdminCourseGovernanceService.php`
- [ ] T032 [P] [US2] Implement moderation audit model and persistence logic in `backend/app/Domains/Courses/Models/CourseModerationAction.php`
- [ ] T033 [US2] Create moderation actions migration/indexes in `backend/database/migrations/2026_04_08_002000_create_course_moderation_actions_table.php`
- [ ] T034 [US2] Implement admin governance API controller in `backend/app/Http/Controllers/Api/Courses/AdminCourseGovernanceController.php`
- [ ] T035 [US2] Implement admin indicator projection/query builder in `backend/app/Domains/Courses/Queries/AdminCourseIndicatorQuery.php`
- [ ] T036 [US2] Implement Filament admin resource for course governance views/actions in `backend/app/Filament/Resources/CourseGovernanceResource.php`

**Checkpoint**: US2 is independently testable with full admin governance behavior.

---

## Phase 5: User Story 3 - Dashboard-Based Course Management Experience (Priority: P3)

**Goal**: Deliver guided teacher/academy authoring flow with immediate order reflection and post-creation management.

**Independent Test**: Teacher/academy can complete 3-step authoring flow, publish valid course, and see reorder changes reflected immediately.

### Tests for User Story 3

- [ ] T037 [P] [US3] Add teacher wizard end-to-end flow tests in `frontend/src/__tests__/teacher/course-wizard-flow.test.tsx`
- [ ] T038 [P] [US3] Add academy wizard end-to-end flow tests in `frontend/src/__tests__/academy/course-wizard-flow.test.tsx`
- [ ] T039 [P] [US3] Add stage validation blocking tests in `frontend/src/__tests__/courses/course-wizard-validation.test.tsx`
- [ ] T040 [US3] Add ordering reflection/reload consistency tests in `frontend/src/__tests__/courses/course-ordering-reflection.test.tsx`

### Implementation for User Story 3

- [ ] T041 [P] [US3] Implement shared course wizard state/store and contracts in `frontend/src/features/courses/wizard/useCourseWizard.ts`
- [ ] T042 [P] [US3] Implement foundational details step component in `frontend/src/features/courses/wizard/steps/CourseWizardDetailsStep.tsx`
- [ ] T043 [P] [US3] Implement structure management step with reorder UI in `frontend/src/features/courses/wizard/steps/CourseWizardStructureStep.tsx`
- [ ] T044 [P] [US3] Implement review/publish step component in `frontend/src/features/courses/wizard/steps/CourseWizardReviewStep.tsx`
- [ ] T045 [US3] Implement teacher course create wizard page in `frontend/src/app/teacher/courses/create/page.tsx`
- [ ] T046 [US3] Implement academy course create wizard page in `frontend/src/app/academy/courses/create/page.tsx`
- [ ] T047 [US3] Implement teacher course management details page in `frontend/src/app/teacher/courses/[id]/page.tsx`
- [ ] T048 [US3] Implement academy course management details page in `frontend/src/app/academy/courses/[id]/page.tsx`
- [ ] T049 [US3] Implement shared frontend ordering sync hook in `frontend/src/features/courses/useCourseOrderingSync.ts`

**Checkpoint**: US3 is independently testable for guided authoring and management behavior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, reliability checks, and evidence completion across all stories.

- [ ] T050 [P] Add concurrent reorder conflict tests in `backend/tests/Feature/Courses/CourseOrderingConcurrencyTest.php`
- [ ] T051 [P] Add owner/admin lifecycle conflict resolution tests in `backend/tests/Feature/Courses/CourseOwnershipModerationConflictTest.php`
- [ ] T052 Add partial failure rollback/compensation tests for progress updates in `backend/tests/Feature/Courses/CourseProgressRollbackTest.php`
- [ ] T053 Update readiness evidence and SC outcomes in `specs/004-courses-phase2-phase4/readiness-report.md`
- [ ] T054 [P] Complete FR→implementation trace links in `specs/004-courses-phase2-phase4/traceability-matrix.md`
- [ ] T055 Update architecture notes for phases 2–4 domain/UI additions in `docs/ARCHITECTURE.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and lifecycle contracts from US1.
- **Phase 5 (US3)**: Depends on Phase 2 and requires stable owner APIs from US1.
- **Phase 6 (Polish)**: Depends on completion of US1, US2, and US3.

### User Story Dependencies

- **US1 (P1)**: Can start immediately after foundational phase; provides core API/behavior contracts.
- **US2 (P2)**: Depends on shared course lifecycle/state model; otherwise independently testable.
- **US3 (P3)**: Depends on owner API completeness and ordering behavior from US1.

### Within Each User Story

- Tests first, verify failing baseline.
- Services and domain logic before controllers/resources.
- Frontend wizard steps before route pages.
- Story evidence/docs after behavior is validated.

### Parallel Opportunities

- Setup tasks `T003` and `T004` can run in parallel.
- Foundational tasks `T006`, `T007`, and `T010` can run in parallel.
- US1 tests `T011`–`T014` can run in parallel.
- US1 service tasks `T018`–`T021` can run in parallel.
- US2 tests `T028` and `T029` can run in parallel.
- US3 tests `T037`–`T039` can run in parallel.
- US3 wizard step tasks `T042`–`T044` can run in parallel.

---

## Parallel Example: User Story 3

- Run in parallel:
  - `T037` in `frontend/src/__tests__/teacher/course-wizard-flow.test.tsx`
  - `T038` in `frontend/src/__tests__/academy/course-wizard-flow.test.tsx`
  - `T039` in `frontend/src/__tests__/courses/course-wizard-validation.test.tsx`
- Then continue with:
  - `T041`–`T044` wizard implementation
  - `T045`–`T049` route pages and ordering sync

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 lifecycle + structure + access + progress APIs.
3. Validate US1 test suite and event publication.
4. Demo owner workflow from draft to publish/archive.

### Incremental Delivery

1. Ship US1 core behavior.
2. Add US2 admin governance and moderation.
3. Add US3 teacher/academy guided dashboard flow.
4. Finish reliability and readiness evidence in polish.

### Parallel Team Strategy

1. Backend domain/API stream: US1.
2. Admin governance stream: US2 (after shared lifecycle model stabilizes).
3. Frontend dashboard stream: US3 (against stable owner APIs).

---

## Notes

- Every task follows required checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- User-story label appears only in user-story phases.
- Scope remains limited to Phase 2, Phase 3, and Phase 4 deliverables (`FR-016`).
