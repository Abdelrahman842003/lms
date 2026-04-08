# Implementation Plan: Course System Phase 2, Phase 3, and Phase 4

**Feature**: `004-courses-phase2-phase4`  
**Spec**: `specs/004-courses-phase2-phase4/spec.md`  
**Date**: 2026-04-08  
**Status**: Ready for execution

## 1) Scope & Objectives

This plan covers only:
- **Phase 2 (Core Domain + Behavior APIs)**: course lifecycle, structure management, access checks, sequencing, progress state updates, and event publication behavior.
- **Phase 3 (Admin Governance)**: centralized admin visibility, filtering, moderation actions, and core indicators.
- **Phase 4 (Dashboard Authoring Experience)**: guided teacher/academy authoring and management with immediate ordering reflection.

Out of scope (deferred to later specs/phases):
- Learner consumption screens (Phase 5)
- Security hardening rollout details (Phase 6)
- Gamification rollout (Phase 7)
- Notifications rollout (Phase 8)

## 2) Delivery Contract

### Inputs
- Approved specification in `spec.md`
- Approved Phase 1 data foundation
- Existing LMS role/identity model and ownership boundaries
- Existing reusable video/assessment domains

### Outputs
- Executable lifecycle and structure management capabilities for course owners
- Admin governance capabilities with moderation and indicators
- Guided dashboard authoring journey for teacher and academy roles
- Readiness evidence proving FR/SC coverage for Phase 5 handoff

### Success Criteria
- FR-001 → FR-016 fully mapped to implementation workstreams
- SC-001 → SC-005 evidenced via test/readiness checklist
- No unresolved dependencies from Phase 2–4 before Phase 5 kickoff

### Error / Failure Modes
- Concurrent structure edits causing ordering conflicts
- Lifecycle state conflicts (owner action vs admin moderation)
- Partial/failed progress updates causing inconsistent states
- Unauthorized access to protected lesson content/documents
- Ownership mismatch between actor and target course

## 3) Technical Context (from current repo)

- Backend is a Laravel/PHP application in `backend/`
- Existing routes/domain/testing foundations are present
- Admin tooling is available via Filament area in backend structure
- Frontend dashboard app exists under `frontend/` for teacher/academy flows
- Spec/checklist workflow is managed under `specs/`

## 4) Work Breakdown Structure

## Phase 2 — Core Domain and Behavioral API Layer

### 2.1 Lifecycle Management (FR-001)
Deliver deterministic course lifecycle behavior:
- create / update / retrieve
- publish transition with precondition checks
- archive transition preserving historical learner records

Lifecycle contract:
- define allowed transitions (e.g., draft → published → archived)
- reject invalid transitions with explicit reason codes
- emit operational records for lifecycle actions

### 2.2 Levels/Lessons Structure Management (FR-002, FR-015)
Provide full owner-side structure operations:
- add/edit/remove levels
- add/edit/remove lessons
- reorder levels/lessons

Structure guarantees:
- strict unique position within scope
- no duplicate position after reorder
- no gaps after delete/reindex policy execution
- ordering changes reflected immediately in subsequent views

### 2.3 Lesson Type Handling (FR-003)
Support only valid lesson categories:
- `video`
- `document`
- `assessment`

For each category, enforce presence of required metadata and content references; reject invalid or incomplete mapping.

### 2.4 Access Decisions + Sequencing Rules (FR-004, FR-005)
- Evaluate learner entitlement before course/lesson exposure
- Enforce lock behavior for sequential courses
- Allow progression only after prerequisite completion conditions are met

Decision outcomes must be deterministic and explainable (`allowed`, `denied_not_entitled`, `denied_locked`, etc.).

### 2.5 Progress State Engine (FR-006, FR-008)
Maintain consistent status at three scopes:
- lesson
- level
- course

Rules:
- lesson completion updates must cascade to level/course snapshots
- repeated completion events must be idempotent
- partial failure must not leave contradictory states

### 2.6 Owner Reporting View Data (FR-007)
Expose owner-facing enrollment/progress summaries including:
- enrolled learners count
- per-learner progress indicators
- course-level completion trend indicators

### 2.7 Protected Document Access Flow (FR-009)
- Provide short-lived protected document access flow
- Reject unauthorized access attempts
- Ensure denial events are auditable

### 2.8 Event Publication for Downstream Systems (FR-010)
Publish lifecycle and progress events for future integrations:
- course published
- lesson completed
- level completed
- course completed

Event contract must be stable and versioned for downstream consumers.

**Exit Criteria (Phase 2):**
- lifecycle/structure/access/sequencing/progress behaviors validated
- protected document access enforcement validated
- event publication validated for mandatory lifecycle/progress cases

---

## Phase 3 — Admin Governance

### 3.1 Admin Course Registry and Filtering (FR-011)
Deliver centralized admin views:
- list all courses
- filter by owner/status/structure scale/enrollment signals
- open details view

### 3.2 Moderation Actions (FR-011, FR-003)
Enable moderation commands:
- suspend
- archive
- delete (as policy permits)

Governance guarantees:
- moderation actions are audited
- view state updates consistently after action
- owner/admin conflicts resolve by defined precedence policy

### 3.3 Core Indicators (FR-012)
Show required indicators per course:
- owner
- status
- structure size (levels/lessons)
- enrollment volume
- completion trend

Indicator definitions must be consistent and reproducible across reloads/filters.

**Exit Criteria (Phase 3):**
- admin list/filter/details/moderation all operational
- all moderation actions auditable and reflected in admin views
- required indicators accurate per acceptance checks

---

## Phase 4 — Teacher/Academy Dashboard Authoring Experience

### 4.1 Dual-Role Authoring Experience (FR-013)
Provide equivalent guided management experience for:
- teacher dashboard users
- academy dashboard users

Role restrictions apply to ownership boundaries only; core capability parity is required.

### 4.2 Three-Stage Wizard Flow (FR-014)
Authoring flow must include:
1. Foundational details
2. Structure management (levels/lessons)
3. Review and publish

Each stage must enforce validation before advancing.

### 4.3 Ongoing Management Experience (FR-002, FR-015)
Allow post-creation operations:
- edit course details
- reorder levels/lessons
- review learner progress summaries

Changes must reflect immediately in management views and remain consistent after reload.

**Exit Criteria (Phase 4):**
- teacher and academy can complete end-to-end guided authoring
- publish-ready validation prevents invalid structures
- ordering changes persist and render correctly across sessions

## 5) Cross-Phase Non-Functional Guardrails

- Deterministic authorization and sequencing decisions
- Idempotent progress updates for duplicate events
- Concurrency-safe ordering operations
- Complete audit trail for lifecycle and moderation actions
- Clear, stable state model for all role-specific views

## 6) Edge Cases to Validate

1. Publish attempt with incomplete course structure
2. Reorder request creates duplicate/skipped positions
3. Concurrent edits to same course structure
4. Learner attempts locked lesson in sequential course
5. Non-owner tries to edit foreign course
6. Admin moderation collides with owner lifecycle action
7. Progress update event partially fails during lesson completion

## 7) Testing Strategy (minimal + mandatory)

### Phase 2 Behavior Tests
- lifecycle transition validity tests
- structure CRUD + reorder integrity tests
- lesson type validation tests
- entitlement and sequencing decision tests
- progress cascade/idempotency tests
- protected document access authorization tests
- lifecycle/progress event publication tests

### Phase 3 Governance Tests
- admin list/filter/details coverage
- moderation action execution and audit verification
- indicator correctness checks across filter combinations

### Phase 4 Dashboard Flow Tests
- teacher end-to-end wizard completion
- academy end-to-end wizard completion
- stage-level validation blocking behavior
- immediate reflection of ordering updates in management views

### Reliability/Conflict Tests
- concurrent update simulations for ordering
- owner/admin action conflict resolution checks
- partial failure rollback/compensation checks for progress updates

## 8) Milestones & Sequencing

1. **M1: Phase 2 Core Lifecycle Ready**
   - lifecycle + structure + validation baseline complete
2. **M2: Access/Sequencing/Progress Stable**
   - authorization, locking, and progress consistency verified
3. **M3: Event + Protected Document Flow Ready**
   - mandatory events and secure document flow verified
4. **M4: Phase 3 Admin Governance Delivered**
   - centralized views, filters, moderation, indicators complete
5. **M5: Phase 4 Dashboard Authoring Delivered**
   - guided teacher/academy authoring and management complete
6. **M6: Readiness Review Passed**
   - FR/SC trace accepted, zero blockers for Phase 5

## 9) Risk Register & Mitigation

- **Risk**: Ordering corruption under concurrent edits  
  **Mitigation**: transaction-safe reorder algorithm + conflict detection + retries.

- **Risk**: Admin/owner lifecycle conflicts  
  **Mitigation**: explicit precedence matrix and deterministic state-transition rules.

- **Risk**: Inconsistent progress aggregates  
  **Mitigation**: idempotent updates, atomic state transitions, and reconciliation checks.

- **Risk**: Unauthorized document exposure  
  **Mitigation**: strict entitlement checks, short-lived access flow, and deny logging.

- **Risk**: Role experience drift between teacher and academy dashboards  
  **Mitigation**: shared wizard contract with role-specific ownership constraints only.

## 10) Traceability Matrix (Spec → Plan)

- **FR-001** → lifecycle management workstream
- **FR-002** → levels/lessons CRUD + reorder workstream
- **FR-003** → lesson type validation + metadata contract
- **FR-004** → entitlement decision engine
- **FR-005** → sequencing lock enforcement
- **FR-006** → lesson/level/course progress state engine
- **FR-007** → owner progress/enrollment views
- **FR-008** → learner availability/progress summary behavior foundation
- **FR-009** → protected document access behavior
- **FR-010** → lifecycle/progress event publication
- **FR-011** → admin list/filter/details/moderation
- **FR-012** → admin core indicators model
- **FR-013** → teacher + academy capability parity
- **FR-014** → 3-stage guided authoring workflow
- **FR-015** → immediate ordering reflection guarantee
- **FR-016** → scope boundaries enforced in this plan

- **SC-001** → guided creation completion rate target
- **SC-002** → sequencing validation pass target
- **SC-003** → admin moderation reflection + audit target
- **SC-004** → progress consistency pass-rate target
- **SC-005** → explicit no-blocker handoff gate to Phase 5

## 11) Definition of Done (Overall)

Done means:
- Phase 2 capabilities operate consistently for lifecycle, structure, access, sequencing, progress, and events
- Phase 3 admin governance delivers accurate oversight and auditable moderation
- Phase 4 dashboard authoring enables teacher/academy self-service from draft to publish
- FR and SC evidence is documented and accepted
- Phase 5 kickoff has zero blockers caused by missing Phase 2–4 deliverables
