# Implementation Plan: Course System Phase 5, Phase 6, Phase 7, and Phase 8

**Feature**: `005-courses-phase5-phase8`  
**Spec**: `specs/005-courses-phase5-phase8/spec.md`  
**Date**: 2026-04-08  
**Status**: Ready for execution

## 1) Scope & Objectives

This plan covers only:
- **Phase 5 (Student Learning Experience)**: learner course listing/details, state visibility (`locked/current/completed`), and progress reflection.
- **Phase 6 (Security Hardening)**: protected document access, strict authorization enforcement, and content access auditing.
- **Phase 7 (Reward Integration)**: configurable course milestone points with duplicate-proof transaction behavior.
- **Phase 8 (Notification Integration)**: event-driven, multi-channel, idempotent notification delivery to correct recipients.

Out of scope (deferred or already delivered in earlier phases):
- Core lifecycle/authoring/admin foundations from Phases 2–4
- New identity model changes
- Rebuilding existing video/assessment core platforms

## 2) Delivery Contract

### Inputs
- Approved specification in `spec.md`
- Stable Phase 2–4 lifecycle/access/progress/event foundations
- Existing protected video delivery patterns
- Existing notification and queue infrastructure
- Existing guardian association data for routing

### Outputs
- Student-facing course learning experience with accurate state/progress visibility
- Secure private document access flow with logging and denial auditing
- Configurable rewards integration for course milestones with no duplicate transactions
- Idempotent notifications delivered via realtime and mobile push channels
- Readiness evidence demonstrating FR/SC coverage across Phases 5–8

### Success Criteria
- FR-001 → FR-016 fully mapped to implementation workstreams
- SC-001 → SC-005 evidenced by security, behavior, and reliability validation
- Zero unresolved blockers for full course experience rollout

### Error / Failure Modes
- Expired or shared secure document sessions used outside policy window
- Duplicate milestone events causing duplicate reward/notification side effects
- Notification retries producing duplicate end-user messages
- Entitlement mismatch between course access and lesson content references
- Inactivity reminders sent after student has already resumed learning

## 3) Technical Context (from current repo)

- Backend services and events exist under `backend/` Laravel structure
- Frontend app exists under `frontend/` and can host student course screens
- Existing secure media access and audit patterns are already present in platform design
- Specs/checklists are maintained under `specs/` for phase-gated readiness

## 4) Work Breakdown Structure

## Phase 5 — Student Course Learning Experience

### 5.1 Student Course List (FR-001)
Deliver dedicated student course listing behavior:
- show only authorized courses
- include course-level progress summary and status signals
- hide non-granted courses by default

### 5.2 Student Course Details and Lesson States (FR-002)
Provide detail experience with:
- level/lesson structure in expected order
- per-lesson state labels: `completed | current | locked`
- progress indicators that match backend progress state

### 5.3 Lesson Consumption Across Content Types (FR-003)
Ensure lesson launch/consumption works for:
- video lessons
- document lessons
- assessment lessons

Using existing content experiences; only course-context gating and state reflection are in-scope.

### 5.4 Sequential Lock Enforcement + Progress Reflection (FR-004, FR-005)
- block locked lessons for sequential courses
- show prerequisite guidance on blocked attempts
- update lesson and course progress after valid completion actions

### 5.5 Assessment Access Preconditions (FR-008)
Before assessment attempts, enforce:
- valid course access grant
- prerequisite completion requirements

Reject invalid attempts with explicit decision reasons.

**Exit Criteria (Phase 5):**
- authorized visibility behavior confirmed
- locking/unlocking logic confirmed
- lesson/course progress reflection consistent for all supported lesson types

---

## Phase 6 — Security Hardening for Course Content

### 6.1 Private Document Access Sessions (FR-006)
Implement protected document access flow:
- private retrieval path only
- short-lived authorization sessions/tokens
- automatic expiration after defined window

### 6.2 Unauthorized Denial + Audit (FR-007)
- deny access without valid grant/session
- record denied attempts with actor/time/context

### 6.3 Unified Access Logging (FR-009)
Maintain access logs aligned with protected video standards:
- allowed and denied outcomes
- decision reason category
- traceability for compliance/security review

### 6.4 Abuse/Leakage Controls
- prevent long-lived reusable URLs
- detect cross-device/token reuse patterns where policy applies
- maintain auditability of suspicious attempts

**Exit Criteria (Phase 6):**
- no persistent public document URL remains usable
- unauthorized attempts consistently denied and logged
- log completeness validated against expected security fields

---

## Phase 7 — Reward Integration (Gamification)

### 7.1 Configurable Reward Rules (FR-010)
Support configurable point rules for:
- lesson completion
- level completion
- course completion
- lesson streak bonuses
- perfect assessment bonus
- fast completion bonus

### 7.2 Duplicate-Proof Reward Transactions (FR-011)
Guarantee at-most-once transaction semantics per eligible milestone:
- unique milestone identity definition
- idempotent write behavior on retries
- conflict-safe handling for concurrent event delivery

### 7.3 Reward Validation + Reconciliation
- validate awarded points against active rule configuration
- include reconciliation checks for missing/duplicate side effects

**Exit Criteria (Phase 7):**
- all configured milestones map to deterministic transactions
- duplicate transaction rate remains within SC threshold target

---

## Phase 8 — Notification Integration

### 8.1 Event Coverage (FR-012)
Support notification generation for:
- course published
- lesson availability/completion
- level completion
- course completion
- assessment result
- inactivity reminder
- points earned

### 8.2 Channel Delivery Model (FR-013)
Deliver notifications via:
- in-app realtime channel
- mobile push channel
- asynchronous queue-backed processing

### 8.3 Correct Recipient Routing (FR-014)
Route per event policy to intended segment(s):
- student
- guardian
- teacher

### 8.4 Idempotent Notification Workflows (FR-015)
- retry-safe dispatch
- no duplicate user-facing messages for same event occurrence
- delivery records for audit/debug visibility

**Exit Criteria (Phase 8):**
- intended recipients receive intended message types
- retry paths do not produce duplicate notifications
- delivery telemetry supports operational verification

## 5) Cross-Phase Guardrails

- Deterministic access decisions across all course entry points
- Idempotency for reward and notification side effects
- Strict policy-based expiration for protected document access
- Complete, queryable audit logs for security and delivery operations
- Consistent learner state presentation between list and details views

## 6) Edge Cases to Validate

1. Student has course grant but referenced lesson content is unavailable
2. Mixed lesson types with one failing resource during active learning
3. Document session expires mid-reading interaction
4. Shared secure document URL used on another device
5. Repeated lesson-complete events due to retries
6. Notification retry storm risks duplicate sends
7. Assessment completion attempt before prerequisite completion
8. Inactivity reminder races with resumed learning activity

## 7) Testing Strategy (minimal + mandatory)

### Phase 5 Experience Tests
- student list authorization visibility tests
- details state rendering tests (`locked/current/completed`)
- sequential lock enforcement tests
- progress accuracy tests after each valid action
- assessment precondition enforcement tests

### Phase 6 Security Tests
- authorized document access within validity window
- expired/unauthorized access denial tests
- cross-device/replay misuse scenario tests
- access audit logging completeness tests

### Phase 7 Rewards Tests
- each milestone type awards configured points
- idempotency tests for duplicate event delivery
- concurrency tests for near-simultaneous milestones
- reconciliation checks for missing/duplicate transactions

### Phase 8 Notifications Tests
- event-to-template mapping coverage tests
- recipient routing correctness tests (student/guardian/teacher)
- realtime + push channel delivery tests
- queue retry idempotency / no-duplicate send tests

### End-to-End Reliability Checks
- lesson completion → progress update → reward → notification chain
- failure/retry paths preserve correctness without duplicate side effects

## 8) Milestones & Sequencing

1. **M1: Student Experience Baseline Complete**
   - authorized list/details and lesson state rendering operational
2. **M2: Learning Rules Stabilized**
   - sequencing, progress reflection, and assessment preconditions verified
3. **M3: Security Hardening Complete**
   - protected document access + auditing validated
4. **M4: Reward Integration Complete**
   - configurable rules with duplicate-proof transactions validated
5. **M5: Notification Integration Complete**
   - event coverage, routing, channels, and idempotency validated
6. **M6: Final Readiness Review Passed**
   - FR/SC trace accepted and launch blockers cleared

## 9) Risk Register & Mitigation

- **Risk**: Protected document leakage via replayed links  
  **Mitigation**: short-lived sessions, strict validation, denial logging, and replay detection.

- **Risk**: Inconsistent learner state between views  
  **Mitigation**: single state contract and shared derivation rules for list/detail projections.

- **Risk**: Duplicate points on retried events  
  **Mitigation**: milestone uniqueness keys + idempotent transaction writes.

- **Risk**: Notification duplicates during retries/outages  
  **Mitigation**: idempotent delivery keys and dedup-aware queue consumers.

- **Risk**: Incorrect guardian/teacher routing  
  **Mitigation**: explicit routing matrix tests and delivery record audits.

## 10) Traceability Matrix (Spec → Plan)

- **FR-001** → student authorized course listing
- **FR-002** → student details with lesson state visibility
- **FR-003** → multi-type lesson consumption in course context
- **FR-004** → sequential lock rule enforcement
- **FR-005** → lesson/course progress recalculation and reflection
- **FR-006** → short-lived private document access sessions
- **FR-007** → unauthorized denial with security audit recording
- **FR-008** → assessment attempt access + prerequisite checks
- **FR-009** → content access audit standard alignment
- **FR-010** → configurable reward rules for all course milestones
- **FR-011** → at-most-once reward transaction guarantee
- **FR-012** → notification coverage for required lifecycle/progress events
- **FR-013** → realtime + push + async delivery model
- **FR-014** → event-specific audience routing policy
- **FR-015** → retry-safe notification idempotency controls
- **FR-016** → strict scope boundaries to Phases 5–8

- **SC-001** → unauthorized access rejection validation metric
- **SC-002** → learner state discoverability success metric
- **SC-003** → exactly-once reward transaction metric
- **SC-004** → recipient-correct, duplicate-free notification metric
- **SC-005** → no persistent public document URL validation metric

## 11) Definition of Done (Overall)

Done means:
- student course experience is complete for authorized learning with accurate state/progress visibility
- protected document delivery is secure, short-lived, and fully auditable
- rewards are configurable and duplicate-safe across retries/concurrency
- notifications are event-complete, correctly routed, multi-channel, and idempotent
- FR and SC evidence is documented and accepted for phase completion
