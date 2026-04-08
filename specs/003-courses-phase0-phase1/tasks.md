# Tasks: Course System Phase 0 & Phase 1

**Input**: Design documents from `/specs/003-courses-phase0-phase1/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `checklists/requirements.md`

**Tests**: Included because Phase 0 and Phase 1 testing is explicitly required in `plan.md` section "Testing Strategy (minimal + mandatory)".

**Organization**: Tasks are grouped by user story to support independent implementation and readiness validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story label (`US1`, `US2`, `US3`)
- Every task includes an exact target file path

## Path Conventions

- Backend implementation: `backend/`
- Spec/readiness artifacts: `specs/003-courses-phase0-phase1/`
- Tests: `backend/tests/Feature/Courses/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare folders, stubs, and tracking artifacts used by all stories.

- [ ] T001 Create feature tracking index for execution notes in `specs/003-courses-phase0-phase1/README.md`
- [ ] T002 Create governance decision register template in `specs/003-courses-phase0-phase1/decision-register.md`
- [ ] T003 [P] Create FR/SC traceability matrix skeleton in `specs/003-courses-phase0-phase1/traceability-matrix.md`
- [ ] T004 [P] Create readiness report skeleton in `specs/003-courses-phase0-phase1/readiness-report.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain foundation and enums that all story work depends on.

**⚠️ CRITICAL**: No user story implementation should start before this phase completes.

- [ ] T005 Create course domain enum definitions for ownership/type/state values in `backend/app/Domains/Courses/Enums/CourseEnums.php`
- [ ] T006 [P] Create shared DB schema helper/constant definitions in `backend/database/migrations/0000_00_00_000000_course_schema_conventions.php`
- [ ] T007 [P] Create base Eloquent traits for ordered entities and lifecycle flags in `backend/app/Domains/Courses/Concerns/HasOrderedPosition.php`
- [ ] T008 Create base policy/validation service for phase transition gate in `backend/app/Domains/Courses/Services/CoursePhaseGateService.php`
- [ ] T009 Wire new course domain service provider bindings in `backend/app/Providers/AppServiceProvider.php`

**Checkpoint**: Foundation complete — user stories can proceed.

---

## Phase 3: User Story 1 - Approve Course Governance Decisions (Priority: P1) 🎯 MVP

**Goal**: Ensure all mandatory Phase 0 decisions are captured, conflict-free, and block Phase 1 when unresolved.

**Independent Test**: Decision topics are complete (5/5), conflict detection works, and gate rejects unresolved/conflicting approvals.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add governance completeness validation test in `backend/tests/Feature/Courses/Phase0DecisionGateTest.php`
- [ ] T011 [P] [US1] Add governance conflict detection test in `backend/tests/Feature/Courses/Phase0DecisionConflictTest.php`
- [ ] T012 [US1] Add transition gate rejection/approval test in `backend/tests/Feature/Courses/Phase0ToPhase1GateTest.php`

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create decision record migration with unique topic constraint in `backend/database/migrations/2026_04_08_000100_create_course_governance_decisions_table.php`
- [ ] T014 [P] [US1] Create decision approval migration for multi-stakeholder evidence in `backend/database/migrations/2026_04_08_000110_create_course_governance_approvals_table.php`
- [ ] T015 [P] [US1] Implement `CourseGovernanceDecision` model in `backend/app/Domains/Courses/Models/CourseGovernanceDecision.php`
- [ ] T016 [P] [US1] Implement `CourseGovernanceApproval` model in `backend/app/Domains/Courses/Models/CourseGovernanceApproval.php`
- [ ] T017 [US1] Implement decision completeness/conflict rules in `backend/app/Domains/Courses/Services/CourseGovernanceDecisionService.php`
- [ ] T018 [US1] Implement go/no-go transition guard logic in `backend/app/Domains/Courses/Services/CoursePhaseGateService.php`
- [ ] T019 [US1] Document final approved Phase 0 decision outcomes in `specs/003-courses-phase0-phase1/decision-register.md`

**Checkpoint**: US1 is independently testable and can block/allow Phase 1 correctly.

---

## Phase 4: User Story 2 - Establish Course Data Foundation (Priority: P2)

**Goal**: Deliver the complete course data model with integrity constraints, lifecycle handling, and query-ready indexes.

**Independent Test**: All required entities/relationships exist; integrity and uniqueness constraints enforce valid state; lifecycle behavior preserves history.

### Tests for User Story 2

- [ ] T020 [P] [US2] Add entity relationship integrity test suite in `backend/tests/Feature/Courses/CourseFoundationIntegrityTest.php`
- [ ] T021 [P] [US2] Add ordering and uniqueness constraint test suite in `backend/tests/Feature/Courses/CourseOrderingAndUniquenessTest.php`
- [ ] T022 [P] [US2] Add lesson type enum validation test suite in `backend/tests/Feature/Courses/CourseLessonTypeValidationTest.php`
- [ ] T023 [US2] Add soft-deactivation/history preservation test suite in `backend/tests/Feature/Courses/CourseLifecyclePreservationTest.php`

### Implementation for User Story 2

- [ ] T024 [P] [US2] Create core course structure migrations (courses, levels, lessons) in `backend/database/migrations/2026_04_08_001000_create_course_structure_tables.php`
- [ ] T025 [P] [US2] Create access/progress migrations (group targets, grants, progress, lesson progress) in `backend/database/migrations/2026_04_08_001100_create_course_access_and_progress_tables.php`
- [ ] T026 [US2] Add missing FK/unique/index constraints for integrity and scale in `backend/database/migrations/2026_04_08_001200_add_course_integrity_constraints.php`
- [ ] T027 [P] [US2] Implement `Course` and `CourseGroupTarget` models with ownership/lifecycle fields in `backend/app/Domains/Courses/Models/Course.php`
- [ ] T028 [P] [US2] Implement `CourseLevel` and `CourseLesson` models with ordered sequencing in `backend/app/Domains/Courses/Models/CourseLevel.php`
- [ ] T029 [P] [US2] Implement `CourseAccessGrant` and `CourseProgress` models in `backend/app/Domains/Courses/Models/CourseAccessGrant.php`
- [ ] T030 [P] [US2] Implement `CourseLessonProgress` model and state transition helpers in `backend/app/Domains/Courses/Models/CourseLessonProgress.php`
- [ ] T031 [US2] Implement central integrity/lifecycle domain service in `backend/app/Domains/Courses/Services/CourseFoundationIntegrityService.php`
- [ ] T032 [US2] Add model factory coverage for course domain entities in `backend/database/factories/CourseFactory.php`

**Checkpoint**: US2 is independently testable with complete schema + constraints + lifecycle behavior.

---

## Phase 5: User Story 3 - Verify Readiness for Subsequent Phases (Priority: P3)

**Goal**: Produce formal readiness evidence for Phase 2 handoff with pass/fail status and traceable proof.

**Independent Test**: Readiness checklist/report demonstrates FR and SC coverage, phase gates pass, and integrity verification ≥ 95%.

### Tests for User Story 3

- [ ] T033 [P] [US3] Add readiness evidence completeness test in `backend/tests/Feature/Courses/PhaseReadinessEvidenceTest.php`
- [ ] T034 [US3] Add FR-to-implementation trace coverage test in `backend/tests/Feature/Courses/PhaseReadinessTraceabilityTest.php`

### Implementation for User Story 3

- [ ] T035 [US3] Generate ER mapping and constraint inventory in `specs/003-courses-phase0-phase1/readiness-report.md`
- [ ] T036 [US3] Populate FR→implementation trace matrix with artifact links in `specs/003-courses-phase0-phase1/traceability-matrix.md`
- [ ] T037 [US3] Record SC-001..SC-004 pass/fail outcomes with evidence in `specs/003-courses-phase0-phase1/readiness-report.md`
- [ ] T038 [US3] Publish formal phase gate decision and blockers status in `specs/003-courses-phase0-phase1/README.md`

**Checkpoint**: US3 provides complete and auditable phase handoff evidence.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, documentation, and execution confidence across stories.

- [ ] T039 [P] Add implementation summary and decisions log in `specs/003-courses-phase0-phase1/tasks-summary.md`
- [ ] T040 Validate test suite execution and capture final status snapshot in `specs/003-courses-phase0-phase1/readiness-report.md`
- [ ] T041 [P] Update architecture docs with new course domain foundation notes in `docs/ARCHITECTURE.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story work.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and should run after US1 gate policy is available.
- **Phase 5 (US3)**: Depends on completion of US1 and US2 evidence.
- **Phase 6 (Polish)**: Depends on all user stories.

### User Story Dependencies

- **US1 (P1)**: No story dependency; starts after foundational tasks.
- **US2 (P2)**: Starts after foundational tasks; references gate rules from US1 for phase transition validation.
- **US3 (P3)**: Requires US1 and US2 outputs to generate complete readiness evidence.

### Within Each User Story

- Tests should be authored before implementation and fail before code changes.
- Migrations before model relationships.
- Models before services and lifecycle orchestration.
- Evidence/reporting after implementation and verification.

### Parallel Opportunities

- Setup tasks `T003` and `T004` can run in parallel.
- Foundational tasks `T006` and `T007` can run in parallel.
- US1 model/migration tasks `T013`–`T016` can run in parallel.
- US2 tests `T020`–`T022` can run in parallel.
- US2 migration/model tasks `T024`, `T025`, `T027`–`T030` can run in parallel.
- US3 evidence tasks `T035` and `T036` can run in parallel.

---

## Parallel Example: User Story 2

- Run in parallel:
  - `T020` in `backend/tests/Feature/Courses/CourseFoundationIntegrityTest.php`
  - `T021` in `backend/tests/Feature/Courses/CourseOrderingAndUniquenessTest.php`
  - `T022` in `backend/tests/Feature/Courses/CourseLessonTypeValidationTest.php`
- Then continue with:
  - `T024` and `T025` migrations
  - `T027`–`T030` models

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 governance decision register + gate.
3. Validate gate behavior with US1 tests.
4. Use as go/no-go checkpoint before schema rollout.

### Incremental Delivery

1. Ship US1 (governance gate).
2. Ship US2 (full data foundation).
3. Ship US3 (readiness sign-off artifacts).
4. Finalize with polish tasks and architecture updates.

### Team Parallel Strategy

1. One stream handles governance models/services (US1).
2. One stream handles schema/models/tests (US2).
3. Delivery lead stream prepares traceability/readiness docs (US3) after evidence is available.

---

## Notes

- Every task follows required checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- User-story labels appear only in user story phases.
- Scope intentionally excludes API/UI/gamification/notifications per `FR-012`.
