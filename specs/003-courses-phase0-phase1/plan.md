# Implementation Plan: Course System Phase 0 & Phase 1

**Feature**: `003-courses-phase0-phase1`  
**Spec**: `specs/003-courses-phase0-phase1/spec.md`  
**Date**: 2026-04-08  
**Status**: Ready for execution

## 1) Scope & Objectives

This plan covers only:
- **Phase 0 (Alignment/Governance)**: finalize and approve all mandatory decisions.
- **Phase 1 (Data Foundation)**: deliver database schema, domain models, integrity rules, and readiness evidence.

Out of scope (deferred to later specs/phases):
- API implementation
- Admin dashboard UI
- Student frontend UI
- Gamification and notifications

## 2) Delivery Contract

### Inputs
- Approved specification in `spec.md`
- Stakeholder approvals for Phase 0 decision topics
- Existing LMS identity and ownership model (student/teacher/academy/admin)

### Outputs
- Signed-off Phase 0 decision record
- Phase 1 schema + models + constraints + indexes
- Readiness report proving FR/SC coverage for Phase 2 handoff

### Success Criteria
- FR-001 → FR-012 fully mapped to deliverables
- SC-001 → SC-004 evidenced in checklist/report
- No unresolved governance blockers before schema execution

### Error / Failure Modes
- Conflicting stakeholder approvals
- Incomplete decision record
- Schema integrity gaps (orphan relations, duplicate ordering)
- Ownership or lifecycle behavior ambiguity

## 3) Technical Context (from current repo)

- Backend: Laravel/PHP app under `backend/`
- Existing migrations/models/testing infrastructure are present
- Specs and checklists are tracked under `specs/`
- This phase will primarily touch backend domain + DB foundation

## 4) Work Breakdown Structure

## Phase 0 — Alignment & Governance (Mandatory Gate)

### 0.1 Decision Register Setup
Create a single source of truth document (or table) with these required topics:
1. Student course entry point
2. Pricing model
3. PDF watermark policy
4. Content volume limits
5. Implementation sequence policy

For each topic, capture:
- Final approved value
- Decision owner
- Approval timestamp
- Evidence/reference (meeting note/ticket)
- Status (`approved | rejected | superseded`)

### 0.2 Approval Workflow
- Define approvers (Product + Engineering + Operations/Policy as needed)
- Enforce single final value per topic
- Reject “partial approval” state

### 0.3 Governance Gate (Go/No-Go)
A transition gate must fail if any topic is:
- missing,
- conflicted,
- or not fully approved.

**Exit Criteria (Phase 0):**
- 5/5 required topics approved
- zero conflicts
- sign-off record linked in readiness checklist

---

## Phase 1 — Data Foundation

### 1.1 Domain Entities (FR-003..FR-010)
Implement/validate entities:
- `Course`
- `CourseGroupTarget`
- `CourseLevel`
- `CourseLesson`
- `CourseAccessGrant`
- `CourseProgress`
- `CourseLessonProgress`

### 1.2 Data Model Rules

#### Course
- Supports multiple ordered levels
- Ownership context for `independent instructor` or `academy`
- Lifecycle fields for active/deactivated + reversible deactivation (soft delete/archive strategy)

#### CourseLevel
- Belongs to course
- Unique ordered position per course

#### CourseLesson
- Belongs to level
- Unique ordered position per level
- Content type enum constrained to: `video | document | assessment`

#### CourseGroupTarget
- Belongs to course
- Represents eligible cohorts for access grant policy

#### CourseAccessGrant
- Links learner ↔ course authorization
- Enforces uniqueness by learner+course (unless explicit multi-grant policy exists)

#### CourseProgress
- Aggregate learner progress per course
- Explicit state enum (e.g., `not_started | in_progress | completed | blocked`)
- One active progress record per learner+course

#### CourseLessonProgress
- Learner progress per lesson
- Explicit lesson state enum
- References corresponding course progress context

### 1.3 Integrity & Constraints
- Foreign keys on all relationships
- Cascade/restrict behavior defined intentionally
- Uniqueness constraints:
  - level order within course
  - lesson order within level
  - one learner-course progress aggregate
  - one learner-course access grant (default policy)
- Indexing for expected queries:
  - by `course_id`, `learner_id`, `status/state`, `owner_type+owner_id`
- Prevent orphaned records across structure/access/progress

### 1.4 Lifecycle & Deactivation
- Course reversible deactivation must not destroy historical progress
- Historical progress remains queryable after course deactivation
- Soft delete behavior must be explicit and testable

### 1.5 Readiness Artifacts
Produce Phase 1 evidence pack:
- Entity-relationship mapping
- Constraint/index inventory
- Integrity validation results
- FR→implementation trace matrix
- SC validation summary

**Exit Criteria (Phase 1):**
- all required entities exist
- constraints and indexes verified
- integrity scenario pass rate ≥ 95%
- no blockers for Phase 2 planning

## 5) Edge Cases to Validate

1. Partially approved governance decision
2. Conflicting approvals for same topic
3. Course created with zero levels
4. Level created with zero lessons
5. Unsupported lesson type
6. Access grant exists without progress (and vice versa)
7. Deactivated/soft-deleted course with historical learner records

## 6) Testing Strategy (minimal + mandatory)

### Governance Tests (Phase 0)
- Decision completeness check (5/5)
- Conflict detection check
- Transition gate rejection if unresolved

### Data Integrity Tests (Phase 1)
- Entity creation + required relationships
- Uniqueness constraints enforcement
- FK integrity / orphan prevention
- Progress state transitions at lesson/course granularity
- Deactivation preserves historical records

## 7) Milestones & Sequencing

1. **M1: Governance Setup Complete**
   - Decision register structure ready
2. **M2: Governance Approvals Signed**
   - 5 decision topics fully approved
3. **M3: Schema Foundation Delivered**
   - Migrations + constraints + indexes
4. **M4: Domain Model Wiring Complete**
   - Relationships, enums, lifecycle behavior
5. **M5: Readiness Review Passed**
   - FR/SC evidence accepted, Phase 2 unblocked

## 8) Risk Register & Mitigation

- **Risk**: Governance delay blocks engineering  
  **Mitigation**: Time-box decision sessions + escalation owner.

- **Risk**: Constraint design causes migration rework  
  **Mitigation**: ERD + review before migration freeze.

- **Risk**: Ownership ambiguity (teacher vs academy)  
  **Mitigation**: Explicit ownership contract and fixture tests.

- **Risk**: Historical data loss during deactivation  
  **Mitigation**: soft-delete policy tests + non-destructive lifecycle checks.

## 9) Traceability Matrix (Spec → Plan)

- **FR-001/FR-002** → Phase 0 decision register + approval gate
- **FR-003/FR-004/FR-005** → course/level/lesson structure + type constraints
- **FR-006** → access grant model + uniqueness/integrity
- **FR-007** → course + lesson progress state models
- **FR-008** → ownership context design
- **FR-009** → reversible deactivation policy
- **FR-010** → FK + orphan prevention strategy
- **FR-011** → readiness evidence (integrity/uniqueness/indexing)
- **FR-012** → strict scope boundaries in this plan

- **SC-001** → governance approval completion metric
- **SC-002** → entity/relationship readiness check
- **SC-003** → integrity first-pass pass-rate target
- **SC-004** → explicit handoff gate to Phase 2

## 10) Definition of Done (Overall)

Done means:
- Phase 0 decisions fully approved and conflict-free
- Phase 1 data foundation implemented and validated
- readiness evidence documented and accepted
- no unresolved blockers for Phase 2 kickoff
