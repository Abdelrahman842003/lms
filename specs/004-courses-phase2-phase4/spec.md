# Feature Specification: Course System Phase 2, Phase 3, and Phase 4

**Feature Branch**: `004-courses-phase2-phase4`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "read planV.md and create specific phase Phase 2 and Phase 3 and phase 4"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Govern Course Lifecycle (Priority: P1)

As a teacher or academy manager, I want to create, edit, publish, archive, and structure courses with levels and lessons, so I can deliver full learning paths instead of isolated content.

**Why this priority**: This is the operational core for launching course-based learning and is a prerequisite for all management and learner experiences.

**Independent Test**: Can be fully tested by creating a course draft, adding levels and lessons in order, publishing it, archiving it, and confirming access and progression behavior stays consistent.

**Acceptance Scenarios**:

1. **Given** a teacher with publishing permissions, **When** they create a course and add ordered levels and lessons, **Then** the course structure is saved and retrievable in the same order.
2. **Given** a draft course with valid structure, **When** the owner publishes it, **Then** the course becomes visible to authorized learners and course status reflects publication.
3. **Given** a published course with active learners, **When** the owner archives the course, **Then** new learning starts are blocked while historical progress remains available.

---

### User Story 2 - Admin Oversight and Governance (Priority: P2)

As an administrator, I want centralized course visibility with filtering, moderation actions, and core performance indicators, so platform governance and quality control can happen without relying on teaching teams.

**Why this priority**: Central oversight reduces risk, supports compliance, and enables intervention when course quality or policy issues arise.

**Independent Test**: Can be tested independently by reviewing the admin course list, filtering by key attributes, opening details, and executing moderation actions with auditable outcomes.

**Acceptance Scenarios**:

1. **Given** many courses with different owners and statuses, **When** an admin applies filters, **Then** only matching courses appear with accurate summary metrics.
2. **Given** a policy-violating or inactive course, **When** an admin performs moderation action, **Then** the action is applied and reflected across management views.

---

### User Story 3 - Dashboard-Based Course Management Experience (Priority: P3)

As a teacher or academy user, I want a guided dashboard flow to build and manage courses (basic info, content structure, review/publish), so I can launch complete courses without manual backend intervention.

**Why this priority**: Self-service creation is essential for scale and reduces dependency on technical teams.

**Independent Test**: Can be tested independently by completing the full guided flow from course creation to publish and validating that updates are reflected immediately in management views.

**Acceptance Scenarios**:

1. **Given** a course author starting from an empty state, **When** they complete the guided steps, **Then** a valid course draft is created and can be published.
2. **Given** an existing course, **When** the author reorders levels or lessons, **Then** the updated order persists and is reflected in subsequent views.

---

### Edge Cases

- A course is published with incomplete structure (missing level content or empty required lesson metadata).
- A lesson reordering request causes duplicate or skipped positions.
- Multiple managers update the same course structure at nearly the same time.
- A learner attempts to complete a lesson that is still locked by sequencing rules.
- A manager attempts to edit a course they do not own.
- An admin action conflicts with owner actions in progress (e.g., owner publishing while admin archiving).
- Learner progress update fails during a lesson completion event and risks partial state updates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform MUST provide complete course lifecycle operations for authorized course owners, including create, update, publish, archive, and retrieval.
- **FR-002**: The platform MUST allow course owners to manage levels and lessons, including add, edit, remove, and reorder operations.
- **FR-003**: The platform MUST enforce lesson type handling for video, document, and assessment lessons with suitable content metadata.
- **FR-004**: The platform MUST support learner access entitlement checks before exposing course content.
- **FR-005**: The platform MUST enforce sequencing rules so locked lessons cannot be started before prerequisite completion where sequential mode is enabled.
- **FR-006**: The platform MUST maintain learner progress state at lesson, level, and course scopes with deterministic status updates.
- **FR-007**: The platform MUST expose owner-facing course views that include enrolled learners and their detailed progress indicators.
- **FR-008**: The platform MUST provide learner-facing course availability and progress summaries based on granted access only.
- **FR-009**: The platform MUST provide short-lived protected access flow for course documents and deny unauthorized document access attempts.
- **FR-010**: The platform MUST publish course lifecycle and progress events needed by downstream reward and notification systems.
- **FR-011**: The platform MUST provide centralized admin course management with list view, filtering, details view, and moderation actions (suspend, archive, delete).
- **FR-012**: The admin management view MUST show core indicators per course, including owner, status, structure size, enrollment volume, and completion trend.
- **FR-013**: The platform MUST provide separate dashboard management experiences for teacher and academy users following the same guided creation pattern.
- **FR-014**: The guided authoring flow MUST include three stages: foundational course details, structured levels/lessons management, and final review/publish.
- **FR-015**: The authoring experience MUST support immediate reflection of ordering changes in subsequent management views.
- **FR-016**: The scope of this specification MUST be limited to Phase 2, Phase 3, and Phase 4 deliverables and exclude learner course consumption screens, hardening, gamification, and notifications rollout.

### Key Entities *(include if feature involves data)*

- **CourseLifecycle**: Represents the lifecycle state transitions of a course from draft to published and archived.
- **CourseStructureNode**: Represents ordered instructional components (level or lesson) and their position in the course sequence.
- **LessonContentReference**: Represents a lesson’s mapped educational content category and metadata required for rendering/access.
- **CourseAccessDecision**: Represents the authorization decision for whether a learner may view or interact with a course or lesson.
- **CourseProgressSnapshot**: Represents the learner’s current progression status and completion percentages across lesson/level/course scopes.
- **AdminCourseModerationAction**: Represents governance actions applied by administrators and their resulting course state changes.
- **AuthoringWizardSession**: Represents in-progress guided authoring state used by teacher and academy dashboard flows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of authorized course owners can complete full course creation through the guided flow without manual technical assistance.
- **SC-002**: 100% of sequencing validation scenarios correctly block locked lesson progression and allow eligible progression.
- **SC-003**: 100% of admin moderation actions are reflected in management views and auditable in operational records.
- **SC-004**: At least 95% of course progress update scenarios complete without inconsistent lesson/level/course state.
- **SC-005**: Phase 5 can start with zero blockers caused by missing Phase 2–4 capabilities.

## Assumptions

- Phase 1 data foundation is already approved and available as a dependency for these phases.
- Existing learner identity and role management remain unchanged and are reused for access checks.
- Existing video and assessment capabilities are reused through references instead of rebuilt workflows.
- Dashboard users (teacher and academy) require equivalent management capability with contextual ownership restrictions.
- Learner-facing course consumption interfaces are explicitly out of scope for this feature and handled in later phases.
