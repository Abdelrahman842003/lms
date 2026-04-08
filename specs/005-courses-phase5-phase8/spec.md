# Feature Specification: Course System Phase 5, Phase 6, Phase 7, and Phase 8

**Feature Branch**: `005-courses-phase5-phase8`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "read planV.md and create specific phase Phase 5 and Phase 6 and phase 7 and phase 8"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Course Learning Experience (Priority: P1)

As a student, I want a dedicated course area showing available courses, locked/current/completed lesson states, and my learning progress, so I can follow structured learning paths confidently.

**Why this priority**: This is the direct learner value outcome and the primary goal of transitioning from standalone videos to full courses.

**Independent Test**: Can be tested independently by granting a student access to a course, verifying only authorized courses appear, and validating lesson locking/unlocking and progress updates through lesson completion.

**Acceptance Scenarios**:

1. **Given** a student has access grants to specific courses, **When** they open the course list, **Then** they only see authorized courses with progress summaries.
2. **Given** a course uses sequential progression, **When** the student tries to open a locked lesson, **Then** access is denied and prerequisite guidance is shown.
3. **Given** the student completes a lesson, **When** they return to course details, **Then** lesson status and overall progress are updated accurately.

---

### User Story 2 - Protected Content Access and Compliance (Priority: P2)

As a platform security owner, I want course content—especially documents—to be protected with strict short-lived access and logging controls, so unauthorized distribution is minimized and suspicious activity is detectable.

**Why this priority**: Course monetization and trust rely on content protection levels comparable to secure video delivery.

**Independent Test**: Can be tested independently by attempting authorized and unauthorized access to protected course content and confirming allowed requests succeed while unauthorized requests are denied and logged.

**Acceptance Scenarios**:

1. **Given** a student has valid course access, **When** they request course document content, **Then** they receive temporary protected access that expires automatically.
2. **Given** a user without valid grant or with expired access, **When** they request protected document content, **Then** access is denied and a security event is recorded.

---

### User Story 3 - Reward and Notification Engagement Loop (Priority: P3)

As a student and guardian, I want meaningful points and timely notifications tied to course progress milestones, so engagement and completion consistency increase.

**Why this priority**: Incentives and communication reinforce behavior and improve learning continuity after core delivery is in place.

**Independent Test**: Can be tested independently by completing targeted course events and confirming the right points and notifications are triggered exactly once for intended recipients.

**Acceptance Scenarios**:

1. **Given** a student completes course milestones, **When** milestone events are emitted, **Then** configured point transactions are created without duplication.
2. **Given** course progress events occur, **When** notification workflows execute, **Then** the correct recipients (student, guardian, teacher) receive the right message type without duplicates.

---

### Edge Cases

- Student has access grant to course but no access to one referenced lesson content item.
- Course contains mixed content types and one content resource becomes unavailable during learning.
- Signed document access expires while student is actively reading.
- A protected document URL is reused on another device or shared externally.
- Repeated lesson-complete events arrive for the same lesson due to retries.
- Notification queue retries cause potential duplicate sends for the same event.
- Student completes exam attempt without satisfying prerequisite lesson requirements.
- Long inactivity reminder runs for students who already resumed learning before send time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform MUST provide a dedicated student course listing experience that displays only courses the student is authorized to access.
- **FR-002**: The platform MUST provide student course details view showing level and lesson states (`completed`, `current`, `locked`) and current progress indicators.
- **FR-003**: The platform MUST support course lesson consumption across video, document, and assessment lesson categories through existing content experiences.
- **FR-004**: The platform MUST enforce lesson lock rules and prevent access to lessons blocked by sequential progression policy.
- **FR-005**: The platform MUST maintain accurate lesson and course progress calculations and reflect updates after each valid learning action.
- **FR-006**: Protected course documents MUST be served through private access flow with short-lived authorization windows.
- **FR-007**: The platform MUST deny unauthorized course document access and record denied attempts for security auditing.
- **FR-008**: The platform MUST apply access checks for assessment attempts to ensure prerequisite completion and valid course access grant.
- **FR-009**: The platform MUST retain course content access logs aligned with existing protected video access logging standards.
- **FR-010**: The platform MUST support configurable point rules for course lesson completion, level completion, full course completion, lesson streaks, perfect assessment results, and fast completion bonuses.
- **FR-011**: The reward process MUST create at most one point transaction per eligible milestone occurrence and prevent duplicate transactions.
- **FR-012**: The platform MUST emit notifications for course published, lesson availability/completion, level completion, course completion, assessment results, inactivity reminders, and points earned.
- **FR-013**: Notification delivery MUST support in-app realtime delivery and mobile push delivery channels with asynchronous processing.
- **FR-014**: Notification routing MUST target the correct audience segment (student, guardian, teacher) per event type.
- **FR-015**: Notification workflows MUST enforce idempotency so retries do not produce duplicate user-facing messages.
- **FR-016**: The scope of this specification MUST be limited to Phase 5 through Phase 8 deliverables and exclude earlier phase authoring/admin implementation details.

### Key Entities *(include if feature involves data)*

- **StudentCourseViewState**: Represents learner-visible course structure and per-lesson state (locked/current/completed) plus aggregate progress.
- **ProtectedContentAccessSession**: Represents temporary authorization session for secured course document retrieval and expiry.
- **ContentAccessAuditRecord**: Represents allowed/denied content access events with actor, timestamp, and decision outcome.
- **CourseRewardRule**: Represents configurable point policies for course milestones and bonus conditions.
- **CourseRewardTransaction**: Represents awarded points for a specific learner milestone with uniqueness protection.
- **CourseNotificationEvent**: Represents normalized course progress/lifecycle events used for downstream message dispatch.
- **NotificationDeliveryRecord**: Represents queued and delivered notification attempts per channel and recipient type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of unauthorized course access attempts are rejected across student course screens and protected content routes.
- **SC-002**: At least 95% of students can identify their current lesson and progress state without external support.
- **SC-003**: At least 99% of eligible reward milestones produce exactly one points transaction with no duplicates.
- **SC-004**: At least 99% of notification events are delivered to the intended recipient type without duplicate sends.
- **SC-005**: Security validation confirms no persistent public document URL remains accessible beyond the defined temporary access window.

## Assumptions

- Course domain lifecycle, access, and progress events from earlier phases are available and reliable inputs for these phases.
- Existing protected video delivery patterns are reusable references for document security hardening behavior.
- Existing assessment and notification infrastructure is available for integration without redefining base user identity flows.
- Guardian association data is already available for recipient targeting in notification workflows.
- Document watermarking remains optional and policy-driven; baseline security behavior must still be satisfied when watermarking is disabled.
