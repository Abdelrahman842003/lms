# Architecture - Domain-Driven Design

## Overview

This Laravel Backend LMS project follows **Domain-Driven Design (DDD)** principles to organize code around business domains rather than technical layers. The architecture separates business logic from infrastructure concerns, making the codebase more maintainable and testable.

## Core Architectural Principle: Workspace Isolation (Multi-Tenancy)

> **CRITICAL RULE (قاعدة شديدة الأهمية):**
> لا يوجد أي كيان تعليمي في النظام مرتبط مباشرة بالمستخدم (User).
> جميع الكيانات التعليمية ترتبط بـ Teacher Profile / Workspace فقط.
> الـ User هو وسيلة تسجيل دخول فقط.
> أما البيانات الفعلية فتعيش داخل Workspace مستقل ومعزول بالكامل.

**Independent Teacher vs. Academy Teacher Identity (`Teacher Profile`):**
A single teacher login can have multiple isolated Workspaces (e.g., one Independent Profile, and multiple Academy Profiles). 
Therefore, entities such as `students`, `lectures`, `exams`, `groups`, `classes`, `question_banks`, `reports`, `notifications`, and support `tickets` MUST be linked to a `teacher_profile_id` (or equivalent workspace identifier) and **never** directly to a `user_id` or `teacher_id`. This ensures absolute data isolation between an independent teacher's dashboard (statistics, exams, students) and their academy-affiliated data.

## Domain Structure

The application is organized into the following domains located in `backend/app/Domains/`:

### Core Domains

#### 1. Auth Domain
**Path:** `backend/app/Domains/Auth/`

Handles authentication and authorization for all user types:

- **Models:** `Academy`, `Admin`, `Guardian`, `Secretary`, `Student`, `Teacher`
- **DTOs:** Login data structures for each user type
- **Enums:** `UserRole`, `TeacherStatus`, `StudentGender`, `TeacherAttendanceStatus`, `OrganizationType`, `StudentEducationType`, `DeviceType`
- **Actions:** `LoginAction`, `SendOtpAction`, `VerifyOtpAction`, `GenerateStudentPassword`
- **Services:** `AuthService`, `DeviceLimitService`, `LoginAttemptService`
- **Middleware:** `EnsureUserNotSuspended`, `EnsureActiveEnrollment`, `EnsureActiveSubscription`, `EnsureTeacherNotSuspendedForStudent`, `LoginThrottleMiddleware`, `RateLimitOtp`, `SetAuthCookies`, `InjectBearerTokenFromCookie`
- **Observers:** `StudentObserver`
- **Resources:** API resources for transforming models to JSON responses
- **Notifications:** User-specific notification classes

#### 2. Enrollments Domain
**Path:** `backend/app/Domains/Enrollments/`

Manages student enrollments and group assignments:

- **DTOs:** `CreateEnrollmentDTO`, `CreateGroupDTO`, `GradeData`, `GroupData`, `TeacherGradeData`, `TeacherGroupData`
- **Enums:** `EnrollmentStatus`, `GroupType`, `SeatStatus`, `StudentActivityAction`
- **Repositories:** `EnrollmentRepository`, `GroupRepository` (with Eloquent implementations)
- **Observers:** `EnrollmentObserver`
- **Resources:** `EnrollmentResource`, `GradeResource`, `GroupResource`

#### 3. Exams Domain
**Path:** `backend/app/Domains/Exams/`

Handles exam creation, attempts, and results:

- **Models:** `Exam`, `ExamAttempt`, `ExamResult`, `FailedQuestion`, `Question`, `StudentAnswer`
- **DTOs:** `StudentExamData`, `TeacherExamData`
- **Enums:** `ExamAttemptStatus`, `ExamMode`, `ExamStatus`, `QuestionType`
- **Actions:** `StartAttemptAction`, `SubmitAttemptAction`
- **Builders:** `ExamAttemptBuilder`
- **Jobs:** `ProcessExamEnd`, `ProcessExamStart`
- **Events:** `ExamCompleted`, `ExamStarted`, `SuspiciousActivity`
- **Listeners:** `GrantExamXp`, `RecordMistakes`
- **Observers:** `ExamObserver`
- **Policies:** `ExamPolicy`
- **Resources:** `ExamResource`, `ExamResultDetailResource`, `StudentExamResource`
- **Notifications:** Exam-related notifications

#### 4. Gamification Domain
**Path:** `backend/app/Domains/Gamification/`

Implements gamification features including points, streaks, and leaderboards:

- **Models:** `StudentPoint`, `PointTransaction`
- **Actions:** `GrantXpAction`, `UpdateStreakAction`
- **Enums:** `PointTransactionType`, `QuestType`
- **Jobs:** `RecalculateLeaderboard`
- **Strategies:** `AttendanceXpCalculator`, `MistakeReviewXpCalculator`

#### 5. Lectures Domain
**Path:** `backend/app/Domains/Lectures/`

Manages lecture sessions and attendance:

- **Models:** `Lecture`, `LectureSession`
- **DTOs:** Lecture-related data structures
- **Enums:** Lecture-specific enumerations

#### 6. Media Domain
**Path:** `backend/app/Domains/Media/`

Handles media storage and processing:

- **Adapters:** `CloudflareR2Adapter`, `LocalAdapter`, `StorageAdapter`
- **Jobs:** `ProcessMediaUpload`
- **Services:** `AvatarService`, `ImageService`

#### 7. Notifications Domain
**Path:** `backend/app/Domains/Notifications/`

Manages notifications across multiple channels:

- **Models:** `AcademyNotification`, `SentNotification`
- **DTOs:** `NotificationData`
- **Enums:** `AnnouncementContentType`, `NotificationTargetType`, `NotificationType`
- **Channels:** `DatabaseChannelStrategy`, `FcmChannelStrategy`
- **Contracts:** `NotificationChannelInterface`
- **Factories:** `NotificationFactory`
- **Jobs:** `SendBulkNotificationJob`
- **Events:** `NewNotificationEvent`
- **Listeners:** `BroadcastNotificationSent`
- **Services:** `BulkNotificationService`, `NotificationService`, `NotificationSettingsService`, `VoiceNotificationService`
- **Resources:** `NotificationResource`, `StudentNotificationResource`
- **Support:** `FirebaseCredentialsResolver`

#### 8. Reports Domain
**Path:** `backend/app/Domains/Reports/`

Handles report generation and export:

- **DTOs:** `AcademyReportSummaryData`, `AdminReportSummaryData`, `ReportPeriodData`, `TeacherReportData`, `TeacherReportSummaryData`
- **Contracts:** `ReportExporter`
- **Exporters:** `ExcelExporter`, `PdfExporter`
- **Jobs:** `GenerateReportJob`
- **Factory:** `ExporterFactory`

#### 8b. Reporting Domain
**Path:** `backend/app/Domains/Reporting/`

Advanced analytics, KPI tracking, alert engine, and report builders with a clean 4-layer architecture:

- **Application Layer:**
  - **Actions:** `GenerateAdminReportAction`, `GenerateAdminDrilldownAction`, `GenerateTeacherReportAction`, `BuildReportContextAction`, `BuildAcademyReportContextAction`, `ResolveComparisonContextAction`, `ExportAdminReportAction`
  - **Builders:** `AcademySnapshotBuilder`, `AttendanceQualityBuilder`, `SessionExecutionBuilder`, `StudentDistributionBuilder`, `SubscriptionUsageBuilder`, `TeacherPerformanceBuilder`, `TimeComparisonBuilder`, `AdminExecutiveSnapshotBuilder`, `AdminEntityPerformanceBuilder`, `AdminPlanBreakdownBuilder`, `AdminRevenueTrendBuilder`, `TeacherAttendanceBuilder`, `TeacherGroupBreakdownBuilder`, `TeacherIncomeTrendBuilder`, `TeacherStudentActivityBuilder`, `TeacherSubscriptionBuilder`, `TeacherSummaryBuilder`, `BreakdownBuilder`, `SummaryBuilder`
- **Domain Layer:**
  - **Contracts:** `AlertRule`, `ReportAccessPolicy`
  - **DTOs:** `AlertResult`, `DrilldownDescriptor`, `ExportPayload`, `KpiCardResult`, `TrendMetricResult`
  - **Enums:** `AlertSeverity`, `ComparisonMode`, `Direction`, `GranularityHint`, `ReportingPeriodPreset`
  - **Services (Alert Rules):** `AlertEngine`, `DrilldownRegistry`, `KpiCardFactory`, `TrendCalculationService`, `AttendanceDropRule`, `HighInactivityRule`, `RevenueDropRule`, `StrongGrowthRule`, `UsageNearLimitRule`, `TeacherAlertEngine`, `TeacherAttendanceDrop`, `TeacherIncomeDrop`, `TeacherIncomeConcentration`, `TeacherNearPlanLimit`, `TeacherRenewalApproaching`, `TeacherStudentInactivity`
  - **ValueObjects:** `AcademyReportFilters`, `ComparisonPeriod`, `ReportFilters`, `ReportingPeriod`, `TeacherScope`
- **Infrastructure Layer:**
  - **Queries:** `AcademyAttendanceQueries`, `AcademySessionQueries`, `AcademyStudentQueries`, `AcademySubscriptionQueries`, `AcademyTeacherQueries`, `AcademyAlertDataProvider`, `AdminAcademySummaryQueryService`, `AdminEntityPerformanceQueryService`, `AdminEntityQueryService`, `AdminRevenueQueryService`, `AdminStudentActivityQueryService`, `AdminSubscriptionQueryService`, `AdminTeacherSummaryQueryService`, `TeacherAttendanceQueryService`, `TeacherGroupQueryService`, `TeacherIncomeQueryService`, `TeacherStudentQueryService`, `TeacherSubscriptionQueryService`
  - **Policies:** `AdminReportAccessPolicy`, `DefaultReportAccessPolicy`, `TeacherReportAccessPolicy`
- **Presentation Layer:**
  - **Controllers:** `TeacherReportingController`
  - **Requests:** `TeacherReportRequest`
  - **Resources:** `AdminReportResource`, `AdminDrilldownResource`, `AdminExportResource`, `AlertResource`, `AppliedFiltersResource`, `EmptyReportResource`, `KpiCardResource`, `ReportErrorResource`, `TeacherReportResource`, `TrendMetricResource`

#### 9. Subscriptions Domain
**Path:** `backend/app/Domains/Subscriptions/`

Manages subscription logic and validation:

- **Specifications:** `PlanActive`, `SeatAvailable`

#### 10. Videos Domain
**Path:** `backend/app/Domains/Videos/`

Comprehensive video management system:

- **Models:** `Video`, `VideoAccessGrant`, `VideoAccessLog`, `VideoAttachment`, `VideoComment`, `VideoGroupTarget`, `VideoLike`, `VideoPlaybackToken`, `VideoQuiz`, `VideoQuizAttempt`, `VideoQuizQuestion`, `VideoReminder`, `VideoUploadSession`, `VideoWatchProgress`
- **DTOs:** `CreateVideoData`, `UpdateVideoData`, `VideoActorContext`
- **Enums:** `VideoOwnerType`, `VideoProcessingStatus`, `VideoStatus`, `VideoUploadSessionStatus`, `VideoWatchStatus`
- **Jobs:** `ProcessDueVideoRemindersJob`, `ProcessUploadedVideoJob`, `PublishScheduledVideoJob`, `RevokeExpiredVideoPlaybackTokensJob`
- **Policies:** `VideoPolicy`
- **Resources:** `VideoAttachmentResource`, `VideoCommentResource`, `VideoResource`, `VideoWatchProgressResource`
- **Services:** `R2MultipartService`, `VideoAccessGrantService`, `VideoAccessLoggerService`
- **Notifications:** Video-related notifications

#### 11. Support Domain
**Path:** `backend/app/Domains/Support/`

Provides shared utilities and services:

- **Enums:** `AuditAction`
- **Traits:** `ApiResponseTrait`
- **Services:** `CacheService`

#### 12. Application Domain
**Path:** `backend/app/Domains/Application/`

Contains application-level HTTP controllers and requests that coordinate between domains:

- **Http/Controllers:** Controllers for API endpoints
- **Http/Requests:** Form request validation classes
- **Http/Resources:** Shared API resources
- **Services:** Domain-specific service implementations

### Admin Panel (Filament)

The platform uses [Filament](https://filamentphp.com/) for the admin panel at `/admin`:

- **Resources:** `AcademyResource`, `AdminResource`, `TeacherResource`, `StudentResource`, `SecretaryResource`, `GuardianResource`, `SubscriptionResource`, `VideoResource`, `VideoUploadSessionResource`, `RoleResource`, `PermissionResource`
- **Pages:** Dashboard, Login, System Settings, Notification Settings, Subscription Settings, Video Settings, Google Analytics, Integration Settings, Reports
- **Widgets:** `StatsOverviewWidget`, `RecentAcademiesWidget`, `AcademyDistributionChart`, `AcademyStatsWidget`
- **Custom Components:** `ArabicKeyValue` (RTL support)
- **Plugins:** Spatie Backup, Spatie Health, Activity Log

## Architectural Patterns

### 1. Domain Isolation
Each domain is self-contained with its own:
- Models (Entities)
- DTOs (Data Transfer Objects)
- Enums (Enumerations)
- Actions (Command pattern)
- Services (Application services)
- Resources (API transformers)
- Events/Listeners (Domain events)
- Observers (Model lifecycle hooks)
- Policies (Authorization rules)

### 2. Repository Pattern
Used in the Enrollments domain to abstract data access:
- `EnrollmentRepository` interface with `EloquentEnrollmentRepository` implementation
- `GroupRepository` interface with `EloquentGroupRepository` implementation

### 3. Action Pattern
Domain-specific actions encapsulate business logic:
- `LoginAction`, `SendOtpAction`, `VerifyOtpAction`
- `StartAttemptAction`, `SubmitAttemptAction`
- `GrantXpAction`, `UpdateStreakAction`

### 4. Strategy Pattern
Used in gamification for different XP calculation strategies:
- `AttendanceXpCalculator`
- `MistakeReviewXpCalculator`
- `VideoWatchXpCalculator`
- `AttendancePointStrategy`, `ExamPointStrategy`, `VideoPointStrategy`, `ManualBonusStrategy`

### 5. Specification Pattern
Used in subscriptions for business rule validation:
- `PlanActive`
- `SeatAvailable`
- `SubscriptionCanRenew`
- Composite specifications: `AndSpecification`, `OrSpecification`, `NotSpecification`

### 5b. State Pattern
Used in enrollments for managing enrollment lifecycle states:
- `ActiveState`, `InactiveState`, `TrialState`, `GracePeriodState`, `ExpiredState`
- `EnrollmentStateFactory` for creating state instances

### 5c. Builder Pattern
Used in Reporting domain for constructing complex report data:
- `AcademySnapshotBuilder`, `AdminExecutiveSnapshotBuilder`, `TeacherSummaryBuilder`
- `BreakdownBuilder`, `SummaryBuilder` (shared)

### 6. Factory Pattern
Used for creating notification objects:
- `NotificationFactory`

### 7. Channel Strategy Pattern
Used for multi-channel notifications:
- `DatabaseChannelStrategy`
- `FcmChannelStrategy`

## Cross-Domain Communication

### Events
Domains communicate through domain events:
- `UserLoggedIn` (Auth)
- `ExamCompleted`, `ExamStarted`, `SuspiciousActivity` (Exams)
- `NewNotificationEvent` (Notifications)

### Listeners
Event listeners handle cross-domain concerns:
- `LogLoginAudit` (Auth)
- `GrantExamXp`, `RecordMistakes` (Exams → Gamification)
- `BroadcastNotificationSent` (Notifications)

## Benefits of This Architecture

1. **Separation of Concerns:** Each domain handles its own business logic
2. **Testability:** Isolated domains are easier to unit test
3. **Maintainability:** Changes in one domain don't affect others
4. **Scalability:** Domains can be extracted to microservices if needed
5. **Clear Boundaries:** Well-defined interfaces between domains
6. **Business Alignment:** Code structure mirrors business domains

## Data Flow

1. **Request:** HTTP request hits Application controller
2. **Validation:** Form request validates input
3. **Action:** Domain action processes business logic
4. **Service:** Domain service handles complex operations
5. **Repository:** Data is persisted/retrieved via repositories
6. **Event:** Domain events are dispatched
7. **Response:** API resource transforms data for response

## File Organization

```
backend/app/Domains/
├── Application/          # Application layer (controllers, requests)
├── Auth/                 # Authentication & authorization
├── Enrollments/          # Student enrollments
├── Exams/                # Exam management
├── Gamification/         # Points, streaks, leaderboards
├── Lectures/             # Lecture sessions
├── Media/                # Media storage
├── Notifications/        # Notification system
├── Reporting/            # Analytics, KPIs, alerts, report builders
├── Reports/              # Report generation (PDF/Excel export)
├── Subscriptions/        # Subscription logic
├── Support/              # Shared utilities
└── Videos/               # Video management
```

## Best Practices

1. **Keep domains independent** - Avoid direct dependencies between domains
2. **Use DTOs for data transfer** - Don't pass models directly between layers
3. **Leverage events** - Use domain events for cross-domain communication
4. **Apply SOLID principles** - Single responsibility, dependency inversion
5. **Write tests** - Unit tests for domain logic, integration tests for workflows
6. **Document boundaries** - Clear interfaces between domains
