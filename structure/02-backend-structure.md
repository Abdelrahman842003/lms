# NeetaQ — Backend Structure (Laravel 12 + Octane/Swoole)

## Folder Structure

```
neetaq-backend/
├── app/
│   ├── Support/
│   │   ├── Helpers/
│   │   │   ├── general.php              # دوال مساعدة عامة
│   │   │   └── arabic_numerals.php      # تحويل أرقام عربية
│   │   ├── Traits/
│   │   │   ├── ApiResponse.php          # Response موحد
│   │   │   └── HasAuditLog.php          # تسجيل تلقائي
│   │   ├── Enums/
│   │   │   ├── UserRole.php
│   │   │   ├── OrganizationType.php
│   │   │   ├── EnrollmentStatus.php
│   │   │   ├── SubscriptionStatus.php
│   │   │   ├── LectureStatus.php
│   │   │   ├── ExamMode.php
│   │   │   ├── ExamStatus.php
│   │   │   ├── AttendanceStatus.php
│   │   │   ├── AttendanceMethod.php
│   │   │   ├── QuestionType.php
│   │   │   ├── AttemptStatus.php
│   │   │   ├── AnnouncementContentType.php
│   │   │   ├── GroupType.php
│   │   │   ├── PeriodType.php
│   │   │   ├── SeatStatus.php
│   │   │   ├── QuestType.php
│   │   │   └── AuditAction.php
│   │   ├── Exceptions/
│   │   │   ├── DomainException.php
│   │   │   ├── SeatLimitException.php
│   │   │   ├── SubscriptionExpiredException.php
│   │   │   └── Handler.php
│   │   └── ValueObjects/
│   │       └── DateRange.php
│   │
│   ├── Domains/
│   │   ├── Auth/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/
│   │   │   │   │   ├── LoginController.php
│   │   │   │   │   ├── OtpController.php
│   │   │   │   │   └── LogoutController.php
│   │   │   │   ├── Requests/
│   │   │   │   │   ├── LoginRequest.php
│   │   │   │   │   └── VerifyOtpRequest.php
│   │   │   │   ├── Resources/
│   │   │   │   │   └── AuthUserResource.php
│   │   │   │   └── Middleware/
│   │   │   │       ├── EnsureActiveSubscription.php
│   │   │   │       ├── EnsureActiveEnrollment.php
│   │   │   │       ├── CheckSeatLimit.php
│   │   │   │       ├── RateLimitOtp.php          # 3 req/min
│   │   │   │       ├── RateLimitLogin.php        # 5 req/min
│   │   │   │       └── DeviceSession.php         # device tracking
│   │   │   ├── Actions/
│   │   │   │   ├── LoginAction.php
│   │   │   │   ├── SendOtpAction.php
│   │   │   │   └── VerifyOtpAction.php
│   │   │   ├── DTOs/
│   │   │   │   └── LoginDTO.php
│   │   │   ├── Events/
│   │   │   │   └── UserLoggedIn.php
│   │   │   ├── Listeners/
│   │   │   │   └── LogLoginAudit.php
│   │   │   └── Tests/
│   │   │       ├── Unit/
│   │   │       └── Feature/
│   │   │
│   │   ├── Users/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Http/Resources/
│   │   │   ├── Actions/
│   │   │   ├── DTOs/
│   │   │   ├── Repositories/
│   │   │   │   ├── Contracts/
│   │   │   │   │   └── UserRepository.php
│   │   │   │   └── Eloquent/
│   │   │   │       └── EloquentUserRepository.php
│   │   │   ├── Policies/
│   │   │   ├── Models/
│   │   │   │   └── User.php
│   │   │   └── Tests/
│   │   │
│   │   ├── Organizations/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Http/Resources/
│   │   │   ├── Actions/
│   │   │   ├── DTOs/
│   │   │   ├── Repositories/Contracts/
│   │   │   ├── Repositories/Eloquent/
│   │   │   ├── Policies/
│   │   │   ├── Models/
│   │   │   ├── Events/
│   │   │   ├── Listeners/
│   │   │   └── Tests/
│   │   │
│   │   ├── Teachers/         # نفس البنية
│   │   ├── Students/         # نفس البنية
│   │   ├── Parents/          # نفس البنية
│   │   ├── Secretaries/      # نفس البنية
│   │   │
│   │   ├── Devices/
│   │   │   ├── Http/Controllers/
│   │   │   │   └── DeviceController.php
│   │   │   ├── Actions/
│   │   │   │   ├── RegisterDeviceAction.php
│   │   │   │   ├── RevokeDeviceAction.php
│   │   │   │   └── RevokeAllDevicesAction.php
│   │   │   ├── Models/
│   │   │   │   └── Device.php
│   │   │   ├── Repositories/Contracts/
│   │   │   ├── Repositories/Eloquent/
│   │   │   └── Tests/
│   │   │
│   │   ├── ActivityLog/
│   │   │   ├── Actions/
│   │   │   │   └── TrackActivityAction.php
│   │   │   ├── Models/
│   │   │   │   └── ActivityLog.php
│   │   │   ├── Jobs/
│   │   │   │   └── PurgeOldActivities.php
│   │   │   └── Tests/
│   │   │
│   │   ├── Groups/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Http/Resources/
│   │   │   ├── Actions/
│   │   │   ├── DTOs/
│   │   │   ├── Repositories/Contracts/
│   │   │   ├── Repositories/Eloquent/
│   │   │   ├── Policies/
│   │   │   ├── Models/
│   │   │   └── Tests/
│   │   │
│   │   ├── Lectures/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Http/Resources/
│   │   │   ├── Actions/
│   │   │   │   ├── CreateLectureAction.php
│   │   │   │   ├── ActivateLectureAction.php
│   │   │   │   └── CloseLectureAction.php
│   │   │   ├── DTOs/
│   │   │   ├── Repositories/Contracts/
│   │   │   ├── Repositories/Eloquent/
│   │   │   ├── Events/
│   │   │   │   ├── LectureActivated.php
│   │   │   │   ├── LectureClosed.php
│   │   │   │   └── LectureScheduled.php
│   │   │   ├── Listeners/
│   │   │   │   ├── NotifyGroupOnActivation.php
│   │   │   │   └── ScheduleLectureReminder.php
│   │   │   ├── Jobs/
│   │   │   │   ├── ActivateScheduledLecture.php
│   │   │   │   ├── CloseExpiredLecture.php
│   │   │   │   └── GenerateRecurringLectures.php
│   │   │   ├── Policies/
│   │   │   ├── Models/
│   │   │   └── Tests/
│   │   │
│   │   ├── Attendance/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Http/Resources/
│   │   │   ├── Actions/
│   │   │   │   ├── MarkAttendanceAction.php
│   │   │   │   ├── GenerateQrAction.php
│   │   │   │   └── CheckInAction.php
│   │   │   ├── DTOs/
│   │   │   ├── Events/
│   │   │   │   └── StudentMarkedAbsent.php
│   │   │   ├── Listeners/
│   │   │   │   ├── NotifyParentOnAbsence.php
│   │   │   │   └── GrantAttendanceXp.php
│   │   │   ├── Jobs/
│   │   │   │   └── MarkAbsenteesAfterGrace.php
│   │   │   └── Tests/
│   │   │
│   │   ├── Exams/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Http/Resources/
│   │   │   ├── Actions/
│   │   │   │   ├── CreateExamAction.php
│   │   │   │   ├── StartAttemptAction.php
│   │   │   │   ├── SubmitAttemptAction.php
│   │   │   │   └── GradeEssayAction.php
│   │   │   ├── DTOs/
│   │   │   ├── Builders/
│   │   │   │   └── ExamAttemptBuilder.php  # randomized question set
│   │   │   ├── Repositories/Contracts/
│   │   │   ├── Repositories/Eloquent/
│   │   │   ├── Events/
│   │   │   │   ├── ExamStarted.php
│   │   │   │   ├── ExamCompleted.php
│   │   │   │   └── SuspiciousActivity.php
│   │   │   ├── Listeners/
│   │   │   │   ├── RecordMistakes.php
│   │   │   │   └── GrantExamXp.php
│   │   │   ├── Policies/
│   │   │   ├── Models/
│   │   │   └── Tests/
│   │   │
│   │   ├── Subscriptions/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Actions/
│   │   │   │   ├── CreateSubscriptionAction.php
│   │   │   │   ├── RenewSubscriptionAction.php
│   │   │   │   └── ExpireSubscriptionAction.php
│   │   │   ├── Events/
│   │   │   │   ├── SubscriptionExpiringSoon.php
│   │   │   │   └── SubscriptionExpired.php
│   │   │   ├── Listeners/
│   │   │   │   ├── NotifyOwnerOnExpiring.php
│   │   │   │   └── SuspendEnrollmentsOnExpiry.php
│   │   │   ├── Jobs/
│   │   │   │   ├── CheckExpiringSubscriptions.php
│   │   │   │   └── ProcessExpiredSubscriptions.php
│   │   │   ├── Specifications/
│   │   │   │   ├── SeatAvailable.php
│   │   │   │   └── PlanActive.php
│   │   │   └── Tests/
│   │   │
│   │   ├── Notifications/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Channels/
│   │   │   ├── Events/
│   │   │   ├── Jobs/
│   │   │   │   └── SendBatchNotifications.php  # 100 per batch
│   │   │   └── Tests/
│   │   │
│   │   ├── Announcements/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Http/Requests/
│   │   │   ├── Actions/
│   │   │   ├── Events/
│   │   │   │   └── AnnouncementCreated.php  # Realtime
│   │   │   ├── Jobs/
│   │   │   │   └── DeliverAnnouncementBatch.php
│   │   │   └── Tests/
│   │   │
│   │   ├── Gamification/
│   │   │   ├── Actions/
│   │   │   │   ├── GrantXpAction.php
│   │   │   │   ├── CheckBadgeEligibility.php
│   │   │   │   ├── UpdateStreakAction.php
│   │   │   │   └── ProgressQuestAction.php
│   │   │   ├── Strategies/
│   │   │   │   ├── XpCalculationStrategy.php
│   │   │   │   └── Calculators/
│   │   │   │       ├── AttendanceXp.php
│   │   │   │       ├── ExamXp.php
│   │   │   │       └── MistakeReviewXp.php
│   │   │   ├── Jobs/
│   │   │   │   └── RecalculateLeaderboard.php
│   │   │   ├── Events/
│   │   │   │   ├── XpGranted.php
│   │   │   │   └── BadgeEarned.php
│   │   │   └── Tests/
│   │   │
│   │   ├── Reports/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Actions/
│   │   │   ├── Exporters/
│   │   │   │   ├── ExporterFactory.php     # Factory Pattern
│   │   │   │   ├── Contracts/
│   │   │   │   │   └── ReportExporter.php
│   │   │   │   ├── PdfExporter.php
│   │   │   │   └── ExcelExporter.php       # مستقبلي
│   │   │   ├── Jobs/
│   │   │   │   └── GenerateReportJob.php   # Queued
│   │   │   └── Tests/
│   │   │
│   │   └── Media/
│   │       ├── Http/Controllers/
│   │       ├── Actions/
│   │       ├── Adapters/                   # Adapter Pattern
│   │       │   ├── Contracts/
│   │       │   │   └── StorageAdapter.php
│   │       │   ├── LocalAdapter.php
│   │       │   ├── S3Adapter.php
│   │       │   └── CloudflareAdapter.php
│   │       ├── Jobs/
│   │       │   └── ProcessMediaUpload.php
│   │       └── Tests/
│   │
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   ├── RepositoryServiceProvider.php   # interface → implementation bindings
│   │   ├── EventServiceProvider.php
│   │   └── BroadcastServiceProvider.php
│   │
│   └── Console/
│       └── Kernel.php                      # Scheduled tasks
│
├── routes/
│   ├── api_v1.php                          # /api/v1/...
│   ├── api_v2.php                          # /api/v2/... (مستقبلي)
│   ├── channels.php                        # Reverb channels
│   ├── console.php
│   └── api_health.php                      # GET /api/health
│
├── config/
│   ├── octane.php
│   ├── reverb.php
│   ├── horizon.php
│   ├── permission.php                      # Spatie
│   ├── cors.php                            # CORS whitelist
│   ├── telescope.php                       # Dev debugging
│   ├── scramble.php                        # API docs generation
│   └── neetaq.php                          # App-specific config
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   │   ├── RolePermissionSeeder.php
│   │   ├── AdminSeeder.php
│   │   ├── GradeSeeder.php
│   │   ├── BadgeSeeder.php
│   │   ├── QuestSeeder.php
│   │   ├── SeasonalPresetSeeder.php
│   │   ├── AdminSettingsSeeder.php
│   │   └── NotificationTemplateSeeder.php
│   └── factories/
│
├── tests/
│   ├── Unit/
│   │   └── Domains/                        # Mirrors app/Domains/
│   │       ├── Enrollments/
│   │       │   └── CreateEnrollmentActionTest.php
│   │       ├── Subscriptions/
│   │       ├── Gamification/
│   │       └── ...
│   ├── Feature/
│   │   └── Domains/
│   │       ├── Auth/
│   │       │   └── LoginTest.php
│   │       ├── Lectures/
│   │       ├── Exams/
│   │       └── ...
│   └── TestCase.php
│
├── docs/                                   # VitePress documentation
│   ├── .vitepress/config.ts
│   ├── index.md
│   ├── stack/
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   └── libraries.md
│   ├── architecture/
│   │   ├── erd.md
│   │   ├── folder-structure.md
│   │   ├── realtime-and-queues.md
│   │   └── seasonal-themes.md
│   ├── domains/
│   │   ├── auth.md
│   │   ├── enrollments.md
│   │   ├── exams.md
│   │   ├── gamification.md
│   │   └── ...per domain
│   ├── security/
│   │   ├── octane-rules.md
│   │   ├── auth-flow.md
│   │   └── checklist.md
│   └── api/
│       └── v1/
│           ├── auth.md
│           ├── lectures.md
│           └── ...per domain
│
└── docker/                                 # Docker files
```

---

## Route Versioning

```php
// routes/api_v1.php
Route::prefix('v1')->middleware(['api'])->group(function () {
    // Auth
    Route::prefix('auth')->group(/* ... */);
    // Protected
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::prefix('lectures')->group(/* ... */);
        Route::prefix('exams')->group(/* ... */);
        // ...
    });
});
```

---

## Octane/Swoole Rules

> [!CAUTION]
> قواعد إلزامية عند استخدام Octane

1. **لا تستخدم `static` state** في Services/Actions
2. **لا تخزن request data** في singleton properties
3. **اضبط `--max-requests=1000`** لإعادة تدوير workers
4. **استخدم `Octane::concurrently()`** للعمليات المتوازية
5. **Redis لكل cache** — ممنوع file cache مع Octane
6. **اختبر كل Service** إنه stateless قبل deployment

## Additional Tools

| Tool                       | Purpose                               | Environment      |
| -------------------------- | ------------------------------------- | ---------------- |
| `laravel/telescope`        | Debug queries, jobs, events, requests | Development only |
| `dedoc/scramble`           | Auto-generate OpenAPI docs from code  | All environments |
| Health check `/api/health` | Monitor app + DB + Redis + Queue      | All environments |

## Realtime vs Queue Map

| Feature                       | Realtime (Reverb) |    Queue (Horizon)    |
| ----------------------------- | :---------------: | :-------------------: |
| Notifications UI              |        ✅         |           -           |
| Lecture activated/closed      |        ✅         |           -           |
| Exam state updates            |        ✅         |           -           |
| Announcement visibility       |        ✅         |           -           |
| Notification delivery (5000+) |         -         |    ✅ (100/batch)     |
| Announcement delivery         |         -         |    ✅ (100/batch)     |
| Reports export                |         -         |          ✅           |
| Leaderboard recalc            |         -         |   ✅ (كل 1-3 ساعات)   |
| Media processing              |         -         |          ✅           |
| Bulk student import           |         -         |          ✅           |
| Scheduled lectures            |         -         |  ✅ (Cron/Scheduler)  |
| Absence marking               |         -         | ✅ (بعد grace period) |
| Subscription expiry check     |         -         |       ✅ (يومي)       |

## Design Patterns Used

| Pattern           | Where                                  |
| ----------------- | -------------------------------------- |
| **Repository**    | كل Domain (Contracts + Eloquent)       |
| **Factory**       | Reports Export (PDF/Excel)             |
| **Strategy**      | Gamification XP Calculation            |
| **Adapter**       | Media Storage (Local/S3/Cloudflare)    |
| **Builder**       | Exam Attempt (randomized question set) |
| **Specification** | Enrollment eligibility                 |
| **Observer**      | Model events → Audit logs              |
| **DTO**           | Data transfer بين layers               |
