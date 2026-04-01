# Neetaq LMS — Complete Feature & Technical Analysis

---

## 1. Executive Summary

**Neetaq** is a production-grade, multi-tenant **Learning Management System (LMS)** purpose-built for the Arabic education market. It connects **6 distinct user roles** — Admin, Academy, Teacher, Student, Secretary, and Parent/Guardian — into a unified, real-time platform. Built with **Domain-Driven Design (DDD)** on a Laravel 12 + Next.js 15 stack, the system delivers exam management, live lecture attendance via QR codes, DRM-protected video streaming, gamification with leaderboards, subscription billing, multi-channel notifications, and advanced reporting — all containerized with Docker, orchestrated with Laravel Horizon queues, and delivered through WebSockets.

**Value Proposition:** A vertically-integrated EdTech SaaS that replaces fragmented tools (WhatsApp groups, spreadsheets, paper exams) with one platform — from enrollment to billing to analytics — for independent teachers and multi-teacher academies alike.

---

## 2. Core Features

### 2.1 Multi-Role Authentication & Access Control

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Multi-Guard Login** | Unified login system supporting 6 user types (Admin, Academy, Teacher, Student, Secretary, Parent) with role-specific authentication flows | Laravel Sanctum multi-guard with `AuthService` dispatcher pattern |
| **JWT Token Rotation** | 15-minute access tokens with 30-day refresh tokens, automatic rotation on refresh, single-device logout, multi-device logout | `TokenService` with Sanctum `PersonalAccessToken`, httpOnly cookie transport |
| **Brute-Force Protection** | Escalating ban durations (1 → 5 → 10 → 30 → 60 minutes) after 4 failed login attempts | `LoginAttemptService` with Redis-backed attempt tracking |
| **Device Limit Enforcement** | Per-role device limits — Students: 4, Teachers: 2, Secretaries: 1, Admin: unlimited; auto-removes oldest device | `DeviceLimitService` with token-based device tracking |
| **OTP Verification** | 4-digit OTP generation with 5-minute TTL, single-use enforcement | `SendOtpAction` / `VerifyOtpAction` with Redis caching |
| **Role-Based Access Control (RBAC)** | Granular permission system for secretaries with permission-based sidebar filtering and feature gating | Spatie Laravel Permission package with JSON pivot permissions |
| **IDOR Protection** | Automatic ownership resolution for all resource access — prevents users from accessing other users' data | `ResolvesOwnedResources` trait with type-specific resolution |

### 2.2 Exam Management System

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Exam Creation & Management** | Full CRUD for exams with multiple question types (MCQ, true/false, text), point weighting, scheduling | `TeacherExamData` DTO with Builder pattern |
| **Automated Grading** | Auto-calculates scores/percentages on submission, records per-question answers in DB transaction | `SubmitAttemptAction` with atomic transaction |
| **Exam Attempt Tracking** | Start/submit lifecycle with auto-close for timed exams, attempt limits, status tracking (draft → active → closed) | `StartAttemptAction` with scheduled `ProcessExamEnd` job |
| **Mistake Tracking** | Automatically records wrong answers, tracks mastery over time, supports re-attempt counting | `RecordMistakes` listener with `FailedQuestion` model |
| **Exam Copy/Duplicate** | One-click exam duplication for recurring assessments | `ExamController@copyExam` endpoint |
| **Exam Results & Analytics** | Per-student and per-exam results with percentage scoring, grade tracking | `ExamResult` model with `ExamAttemptBuilder` |

### 2.3 Lecture & Attendance System

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **QR-Based Attendance** | Dynamic QR code generation for check-in/check-out; students scan with their device to mark attendance | `html5-qrcode` scanner + `generateLectureQrCode` endpoint |
| **Manual Attendance** | Fallback manual attendance entry for students without devices | `ManualAttendanceModal` + `AcademyManualAttendanceController` |
| **Lecture Lifecycle** | Full lifecycle: scheduled → active → closed; auto-close expired lectures every 15 minutes | `ActivateLectureAction` / `CloseLectureAction` + `CloseExpiredLecture` scheduled job |
| **Real-Time Lecture Notifications** | Push notifications sent to group members when a lecture goes live | `NotifyGroupOnActivation` listener with FCM via `DeviceToken` |
| **Attendance Export** | PDF export of attendance reports with Arabic RTL font support | `LectureExportService` using mPDF with XB Riyaz font family |
| **Attendance Statistics** | Per-student and per-group attendance rates, trends, and comparison analytics | `CacheService` tagged caching for attendance metrics |

### 2.4 Video Streaming & DRM

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Direct-to-R2 Multipart Upload** | Videos upload directly to Cloudflare R2 — server never receives video bytes; chunked upload with real-time progress | `VideoUploadOrchestrationService` with presigned URLs via AWS SDK |
| **Secure Playback with Tokens** | Time-limited playback tokens prevent unauthorized video access; device fingerprinting | `VideoStreamingService` with `VideoPlaybackToken` model |
| **Video Processing Pipeline** | Automatic transcoding to 720p, thumbnail generation, metadata extraction via FFmpeg | `ProcessUploadedVideoJob` queued with 7200s timeout, 3 retries |
| **Watermark Overlay** | Configurable watermark overlay on video player to prevent screen recording piracy | `WatermarkOverlay` React component |
| **Video Quizzes** | In-video quiz creation by teachers, quiz-taking by students with attempt tracking | `VideoQuizService` with `VideoQuizQuestion` and `VideoQuizAttempt` models |
| **Watch Progress Tracking** | Tracks student viewing progress with resume capability | `VideoWatchProgress` model with `useVideoPlayback` hook |
| **Video Comments & Likes** | Social engagement features on video content | `VideoInteractionService` with `VideoComment` / `VideoLike` models |
| **Storage Quota Enforcement** | Per-plan storage limits with atomic tracking of video + attachment bytes | `StorageQuotaService` with GB-based calculations |
| **Scheduled Publishing** | Schedule videos for future release with automatic publishing | `PublishScheduledVideoJob` queued scheduler |

### 2.5 Gamification & Engagement

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Points System** | Points awarded for attendance, exam performance, mistake review, with configurable multipliers per teacher | `PointService` with `PointTransaction` ledger model |
| **XP with Strategy Pattern** | Pluggable XP calculators for different activity types (attendance, exams, mistake review) with streak bonuses | `GrantXpAction` + `AttendanceXpCalculator` / `ExamXpCalculator` / `MistakeReviewXpCalculator` |
| **Attendance Streaks** | Consecutive attendance tracking with bonus points at milestones (5 and 10) | `UpdateStreakAction` with `BadgeEarned` event dispatch |
| **Leaderboards** | Weekly and all-time leaderboards with filtering by academy/grade/group; paginated with cached results | `PointService` with `CacheService` (65-minute TTL) |
| **Badge System** | Automated badge eligibility: perfect month (100% attendance), streak milestones | `CheckBadgeEligibility` action |
| **Mistake Review** | Dedicated review mode for wrong answers; tracks mastery (pending → mastered) | `MistakesService` with caching |
| **Celebration Animations** | Confetti effects on achievements | `canvas-confetti` integration |

### 2.6 Subscription & Billing

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Multi-Plan Subscriptions** | Trial, Monthly, Quarterly, Semi-Annual, Annual, and Custom plans with per-seat pricing | `PlanFactory` + `AbstractPlan` Strategy pattern |
| **Subscription Lifecycle** | Active → Expiring → Expired → Grace Period with automatic enrollment suspension on expiry | `EnrollmentStateFactory` with State Machine pattern (5 states) |
| **Storage Add-Ons** | Additional storage quota purchasing with subscription plans | `StorageQuotaService` integrated with plan calculations |
| **Payment Tracking** | Full payment log with confirmation workflow, payment codes, and history | `PaymentLog` model with `PaymentCodeDisplay` frontend component |
| **Invoice Generation** | Arabic invoice PDF generation with number-to-Arabic-words conversion | `generateInvoicePDF.ts` with client-side PDF rendering |
| **Renewal Workflow** | Renewal request → approval → activation flow with admin notification | `SubscriptionRenewalService` with Filament + Reverb admin notifications |
| **Subscription Synchronization** | Keeps subscription state consistent across teacher/academy boundaries | `UnifiedSubscriptionSyncService` |

### 2.7 Notification System

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Multi-Channel Delivery** | Real-time via Laravel Reverb WebSocket + push via Firebase FCM for offline delivery | `NotificationService` hybrid with `DatabaseChannelStrategy` + `FcmChannelStrategy` |
| **Bulk Notifications** | Batch notifications to groups of students with chunked processing and progress tracking | `BulkNotificationService` with `SendBulkNotificationJob` |
| **Voice Notifications** | Record and send voice messages (max 40 seconds, 2MB); stored on R2 | `VoiceNotificationService` with `DailyVoiceLimit` tracking |
| **Notification Deduplication** | UUID-based deduplication prevents duplicate notifications | `NotificationService` with UUID generation |
| **Channel Observers** | Monitoring layer for notification delivery across all channels with analytics | Observer pattern: `DatabaseChannelObserver`, `BroadcastChannelObserver`, `FcmChannelObserver`, `AnalyticsChannelObserver` |
| **Recipient Blocking** | Users can block notification senders; blocked list enforced at delivery | `NotificationSettingsService` with blocked recipients |
| **Browser Push Permission** | Modal prompt for browser notification permissions | `NotificationPermissionModal` React component |
| **Real-Time Badge Count** | Live unread notification count in navbar via WebSocket | `NotificationDropdown` + `NotificationContext` + Laravel Echo |

### 2.8 Advanced Reporting & Analytics

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Clean Architecture Reports** | Layered reporting system (Domain → Application → Infrastructure → Presentation) with admin, academy, and teacher scopes | `Reporting` domain with `ReportingPeriod`, `ComparisonPeriod`, `ReportFilters` value objects |
| **KPI Dashboard** | Auto-generated KPI cards with trend indicators (up/down/flat) and comparison periods | `KpiCardFactory` + `TrendCalculationService` |
| **Smart Alert Engine** | Rule-based alerts: revenue drop, usage near limit, high inactivity, attendance decline, renewal approaching | `AlertEngine` with composite Specification pattern |
| **Drill-Down Reports** | Click-through from summary to detailed breakdown with registered drill-down generators | `DrilldownRegistry` pattern |
| **Multi-Format Export** | PDF and Excel export with Arabic RTL support | `ExporterFactory` + `PdfExporter` + `ExcelExporter` |
| **Teacher Reports** | Income trends, attendance performance, student activity, group breakdown, subscription capacity | `TeacherReportController` with 10+ report components |
| **Academy Reports** | Academy snapshot, teacher performance table, student distribution charts, session execution, time comparison | `AcademyReportController` with `AcademyReportFilters` |
| **Financial Reports** | Subscription fee aggregation, payment logs, enrollment revenue tracking at admin/teacher/academy levels | `Admin\ReportService` with mPDF Arabic RTL generation |
| **Attendance Quality Analysis** | Attendance rate tracking with quality panel visualization | `AttendanceQualityPanel` React component |

### 2.9 Student Enrollment Management

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **State Machine Enrollment** | 5 enrollment states (Trial, Active, Inactive, Grace Period, Expired) with defined transitions | `EnrollmentStateFactory` with `EnrollmentStateInterface` |
| **Grade & Group Hierarchy** | Multi-level organization: Grade → Group → Students with ownership validation | `ValidateGroupGrade` action with repository pattern |
| **Seat Limit Enforcement** | Plan-based seat limits with availability checks during enrollment | `SeatAvailable` Specification pattern |
| **Multi-Teacher Enrollment** | Students can enroll with multiple independent teachers | `StudentTeacherContext` + `SelectionContext` for multi-teacher switching |
| **Student Activity Logging** | Tracks all student actions (login, exam, attendance, video) for audit | `StudentActivityLog` model with `StudentActivityAction` enum |
| **Bulk Grade Operations** | Academy-level bulk grade creation and management | `AcademyGradeService` with batch processing |

### 2.10 Parent/Guardian Portal

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Multi-Child Dashboard** | Aggregated view of all children with attendance, exam scores, points, and mistakes | `ParentDashboardController` with child summaries |
| **Per-Child Drill-Down** | Detailed view per child with full performance history | `/parent/[childId]/summary` dynamic route |
| **Parent Notifications** | Video completion, exam results, and attendance alerts pushed to parents | FCM with `ParentDeviceToken` model |
| **Child Management** | View all registered children with status indicators | `ParentLayout` with children validation |

---

## 3. Micro-Features & Details

### 3.1 Security Micro-Features

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Input Sanitization Middleware** | Strips malicious content (XSS, script injection, PHP tags) from all incoming requests | `SanitizeInput` middleware with pattern detection |
| **File Upload Validation** | MIME type verification, extension spoofing detection, malicious content scanning, safe filename generation | `FileUploadValidator` with `<?php`, `<script>`, `javascript:` detection |
| **CSRF Protection** | Double-submit cookie pattern with CSRF token injection in API headers | `csrf.ts` with single-flight guarantee and 10-second reuse window |
| **Rate Limiting** | API-level rate limiting + client-side rate limiter for form submissions | `ApiRateLimiter` middleware + frontend `RateLimiter` class |
| **Secure File Serving** | Files served through controller (not public URLs) with proper headers and video streaming support | `SecureFileResponse` with range request support |
| **CSP Headers** | Content Security Policy headers generated dynamically for XSS prevention | `security.config.js` with CSP generation |
| **Trusted URL Validation** | API client validates that all requests go to trusted backend URLs only | `apiClient.ts` with URL allowlist |
| **Maintenance Mode** | Toggle platform maintenance mode with user-friendly page | `CheckMaintenanceMode` middleware + `MaintenanceGuard` frontend component |
| **OTP Rate Limiting** | Prevents OTP brute-forcing with dedicated rate limiter | `RateLimitOtp` middleware |
| **Suspension Enforcement** | Middleware prevents suspended users from accessing the platform | `EnsureUserNotSuspended` + `EnsureTeacherNotSuspendedForStudent` middleware |

### 3.2 UX & Frontend Micro-Features

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Seasonal Theming** | Dynamic UI themes for Ramadan, Eid, New Year with color palette changes | `SeasonalThemeService` + `seasonalTheme.ts` + `SeasonalDecorations` component |
| **RTL Arabic-First Design** | Full right-to-left layout with Arabic font (Tajawal), Arabic month names, number-to-words | Tailwind CSS variables + custom Arabic formatting |
| **Offline Token Storage** | Hybrid token storage: in-memory primary with sessionStorage fallback | `tokenManager.ts` with listener pattern |
| **Image Cropping** | Upload avatar with aspect ratio cropping before upload | `react-easy-crop` in `ImageCropModal` |
| **Skeleton Loading** | Content placeholder animations during data loading | `Skeleton` UI component + `ReportSkeletons` |
| **Page Transitions** | Animated page transitions for smoother navigation | `PageTransition` wrapper component |
| **Counter Animations** | Animated number counters for dashboard statistics | `useCounterAnimation` hook |
| **Responsive Design** | Fully responsive with mobile sidebar, media query hooks, window size tracking | `useResponsive` / `useMediaQuery` / `useWindowSize` hooks |
| **PWA Install Prompt** | Progressive Web App install prompt for mobile users | `InstallPrompt` component with manifest |
| **Error Boundary** | React error boundary catches rendering errors gracefully | `ErrorBoundary` component |
| **Toast Notifications** | Success/error toast messages with Arabic error code mapping | `react-hot-toast` + `showErrorToast()` with special error codes (TEACHER_SUSPENDED, ACADEMY_EXPIRED) |
| **Debounced Search** | Debounced input fields to reduce API calls | `useForm` hook with `debouncedValues` |
| **Auto-Save Forms** | Forms that automatically save progress | `useForm` with auto-save support |
| **Intersection Observer** | Lazy loading of content when scrolled into view | `useIntersectionObserver` hook |
| **Clipboard Support** | One-click copy to clipboard for payment codes etc. | `useClipboard` hook |
| **Keyboard Shortcuts** | Custom keyboard shortcut support | `useKeyboardShortcuts` hook |

### 3.3 Data & Caching Micro-Features

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Tagged Cache Invalidation** | Granular cache invalidation by entity type (teacher, academy, student) | `CacheService` with `Cache::tags()` |
| **Leaderboard Caching** | 65-minute TTL for leaderboards, batch recalculated via queued job | `RecalculateLeaderboard` job with cache warmup |
| **Cache Service Abstraction** | Centralized caching with `rememberForever` for settings, TTL-based for transient data | `CacheService` wrapper over Laravel Cache |
| **Optimistic UI Updates** | Frontend updates before API response for perceived speed | Context-based state management |
| **IndexedDB for Offline** | Client-side IndexedDB for offline data persistence | `idb` npm package |
| **Web Vitals Monitoring** | Real-time performance metrics collection and reporting | `web-vitals` + `PerformanceContext` + `PerformanceMonitor` component |
| **Bundle Analysis** | Webpack bundle analyzer for optimizing frontend bundle size | `@next/bundle-analyzer` integration |

### 3.4 Infrastructure Micro-Features

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Laravel Octane + Swoole** | High-performance PHP application server with worker recycling | Dockerized with `octane_dev` / `octane_prod` services |
| **Laravel Horizon** | Queue management dashboard with 5 workers, 7200s timeout | Redis-backed queue with Horizon dashboard |
| **Laravel Reverb** | First-party WebSocket server for real-time features | Dockerized `reverb_dev` / `reverb_prod` services on port 8080 |
| **Multi-Stage Docker** | Separate dev/prod Dockerfiles for both backend and frontend | `Dockerfile.dev` / `Dockerfile.prod` with multi-stage builds |
| **Nginx Reverse Proxy** | Production reverse proxy with SSL termination and service routing | `nginx/conf.d/default.conf` + `nginx/ssl/` |
| **Docker Secrets** | Sensitive credentials (Firebase, R2, KV) managed via Docker secrets | `secrets/` directory + `setup-secrets.sh` bootstrap |
| **Makefile Automation** | One-command install, deploy, and development targets | `Makefile` with common operations |
| **Scheduled Tasks** | Cron-based scheduler for expiring lectures, exams, payments, tokens, notifications, storage recalculation | `scheduler_dev` Docker service + Laravel scheduler |
| **Health Checks** | Application health check endpoints for monitoring | `AppServiceProvider` health check registration |

---

## 4. Technical Excellence

### 4.1 Architecture & Design Patterns

| Pattern | Implementation | Domain(s) |
|---------|---------------|-----------|
| **Domain-Driven Design (DDD)** | 14 isolated domain modules with clear boundaries and dependency injection | Entire backend |
| **Action Pattern** | Single-responsibility actions for use cases: `LoginAction`, `StartAttemptAction`, `GrantXpAction`, `CreateEnrollmentAction` | Auth, Exams, Gamification, Enrollments |
| **Strategy Pattern** | Pluggable algorithms: XP calculators, notification channels, storage adapters | Gamification, Notifications, Media |
| **State Machine Pattern** | 5-state enrollment lifecycle with defined transitions | Enrollments |
| **Specification Pattern** | Composite business rules with AND/OR/NOT combinators for subscription/enrollment validation | Subscriptions, Enrollments |
| **Factory Pattern** | `PlanFactory`, `ExporterFactory`, `NotificationFactory`, `EnrollmentStateFactory` | Subscriptions, Reports, Notifications, Enrollments |
| **Repository Pattern** | Data access abstraction: `StudentRepository`, `GroupRepository`, `EnrollmentRepository` with Eloquent implementations | Auth, Enrollments |
| **Observer Pattern** | Model observers + notification channel observers for cross-cutting concerns | Auth, Exams, Enrollments, Notifications |
| **Adapter Pattern** | `CloudflareR2Adapter` / `LocalAdapter` implementing `StorageAdapter` interface | Media |
| **Builder Pattern** | `ExamAttemptBuilder`, `BreakdownBuilder`, `SummaryBuilder`, `ExportPayloadBuilder` | Exams, Reporting |
| **Trait-Based Composition** | `HandlesSecureFileUploads`, `ResolvesOwnedResources`, `ApiResponseTrait`, `HasSubscriptionStatus` | Application-wide |

### 4.2 Technology Stack Advantages

| Layer | Technology | Advantage |
|-------|-----------|-----------|
| **Backend Framework** | Laravel 12 (PHP 8.2) | Latest Laravel with Octane for 2-3x throughput vs standard PHP-FPM |
| **Application Server** | Laravel Octane + Swoole | Persistent workers, zero boot time per request |
| **Database** | MySQL 8.0 | utf8mb4 for full Unicode/Arabic support, strict mode |
| **Cache/Queue/Session** | Redis 7 | Sub-millisecond caching, reliable queue backend |
| **Queue Manager** | Laravel Horizon | Visual dashboard, metrics, failed job management |
| **WebSocket** | Laravel Reverb | First-party, no external service dependency |
| **Authentication** | Laravel Sanctum | Lightweight API token auth with multi-guard |
| **Admin Panel** | Filament 4 with shadcn | Production-grade admin panel in minutes |
| **Frontend Framework** | Next.js 15 (App Router) | Server-side rendering, automatic code splitting |
| **Type Safety** | TypeScript (strict mode) | Compile-time error detection across 11+ type definition files |
| **Validation** | Zod 4 | Runtime schema validation on frontend, matching Laravel's form requests on backend |
| **Styling** | Tailwind CSS 3.4 | Utility-first with CSS variables for dynamic theming |
| **Real-time** | Laravel Echo + Pusher-js | WebSocket integration with private channel auth |
| **State Management** | React Context (8 providers) | Lightweight, no external state library needed |
| **Charts** | Recharts 3.6 | Responsive, composable chart components |
| **PDF** | react-pdf-viewer + mPDF | Client-side viewing + server-side Arabic RTL generation |
| **Containerization** | Docker Compose | Dev/prod parity with profile separation |
| **CI/CD** | GitHub Actions | Backend quality, frontend quality, and security scanning workflows |
| **Testing** | Pest PHP + Jest + Playwright + Storybook | Full-stack testing from unit to E2E |
| **PDF Generation** | mPDF + DOMPDF | Arabic RTL font support (XB Riyaz family) |
| **Image Processing** | Intervention Image | Server-side resize, WebP conversion for avatars |
| **Push Notifications** | Firebase FCM | Cross-platform push with token lifecycle management |
| **Object Storage** | Cloudflare R2 | S3-compatible, zero egress fees |
| **KV Store** | Cloudflare Workers KV | Edge key-value for avatar metadata |

### 4.3 Data Layer Excellence

- **UUID Primary Keys** across all tables for distributed-system compatibility
- **Polymorphic Relations** for notifications, media, and activity logs
- **Soft Deletes** on critical models for data recovery
- **Database Transactions** in exam submission and enrollment creation for atomicity
- **Tagged Cache Invalidation** for granular cache busting
- **Eager Loading** to prevent N+1 query problems
- **Custom Query Builders** (`ExamAttemptBuilder`) for complex, reusable queries
- **Morph Maps** for clean polymorphic type resolution (60+ aliases registered)

---

## 5. Admin & Management Features

### 5.1 Filament Admin Panel

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Academy Management** | Full CRUD for academies with subscription status, plan type, student limits, storage quotas | `AcademyResource` Filament resource |
| **Teacher Management** | Teacher accounts with status management, academy assignment, subscription tracking | `TeacherResource` with relationship fields |
| **Student Management** | Student accounts with enrollment tracking, parent linking, activity logs | `StudentResource` Filament resource |
| **Secretary Management** | Secretary accounts with teacher/academy assignment | `SecretaryResource` Filament resource |
| **Guardian Management** | Parent/guardian accounts with child linking | `GuardianResource` Filament resource |
| **Role & Permission Manager** | Full RBAC management with role creation, permission assignment | `RoleResource` + `PermissionResource` with Spatie |
| **Video Administration** | Video content management with upload session monitoring, processing status | `VideoResource` + `VideoUploadSessionResource` |
| **Subscription Management** | Subscription oversight with plan tracking, renewal management | `SubscriptionResource` Filament resource |
| **Dashboard Widgets** | Overview stats, recent academies, academy distribution chart, academy stats | `StatsOverviewWidget`, `RecentAcademiesWidget`, `AcademyDistributionChart`, `AcademyStatsWidget` |

### 5.2 Admin Settings Pages

| Page | Purpose |
|------|---------|
| **System Settings** | General platform configuration |
| **Video Settings** | Video processing and streaming configuration |
| **Reports** | Admin-level financial and operational reports |
| **Google Analytics** | GA property configuration |
| **Notification Settings** | Channel configuration and defaults |
| **Subscription Settings** | Plan pricing and defaults |
| **Integration Settings** | API keys for Firebase, R2, KV, OpenAI, Gemini, Turnstile (masked in UI) |

### 5.3 Admin Operations & Maintenance

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **11 Scheduled Commands** | Automated tasks: expire lectures, exams, payments, tokens; clean notifications, device tokens; recalculate fees, storage, lecture jobs | `Console/Commands` with Laravel scheduler |
| **Activity Logging** | Comprehensive audit trail via Spatie Activity Log | `activitylog.php` config |
| **Login Audit Trail** | Every login recorded with IP, user agent, timestamp | `LogLoginAudit` queued listener |
| **Settings from Database** | Dynamic settings loaded from DB with encrypted sensitive values (API keys) | `SettingsServiceProvider` with config override |
| **Telescope Debugging** | Laravel Telescope for dev-environment debugging | `TelescopeServiceProvider` with env-based gating |
| **Health Checks** | Application health monitoring endpoints | Registered in `AppServiceProvider` |
| **Cloudflare KV Management** | External KV store management for avatar metadata | `CloudflareKVService` |
| **Storage Recalculation** | Manual/automated storage usage recalculation from DB ground truth | `RecalculateStorageUsage` command |
| **Subscription Fee Recalculation** | Recalculates fees when seat counts change | `RecalculateSubscriptionFees` command |

### 5.4 Multi-Tenant Architecture

| Feature | Description | Technical Highlight |
|---------|-------------|-------------------|
| **Academy Isolation** | Data isolation between academies with academy-scoped queries | `X-Academy-Id` header injection in API client |
| **Independent Teacher Mode** | Teachers can operate independently without an academy | `isInIndependentMode` flag in `AcademyContext` |
| **Academy ↔ Teacher Linking** | Teachers can be linked to academies with permission management | Secretary guard with Spatie permissions |
| **Feature Gating by Plan** | Different subscription plans unlock different features and limits | Specification pattern for plan rule evaluation |
| **Multi-Teacher Students** | Students enroll with multiple teachers across academies | `StudentTeacherContext` with teacher selection |

---

## 6. API Surface Summary

- **100+ API endpoints** across 6 versioned route files (`api/v1/{academy,admin,teacher,student,secretary,guardian}`)
- **70+ Form Request validation classes** for input validation
- **20+ API Resource classes** for response transformation
- **7 Filter classes** for query parameter filtering
- **Custom rate limiters** for avatar upload, token refresh, OTP, and general API

---

## 7. Frontend Scale Summary

- **80+ page routes** across 4 role-based portals (Teacher, Student, Parent, Academy)
- **50+ reusable components** (24 UI primitives + domain-specific)
- **8 React Context providers** for state management
- **13 custom hooks** for logic reuse
- **26 service modules** for API communication
- **Full Arabic i18n** with `ar.json` and `en.json` message files
- **RTL-first design** with Arabic typography (Tajawal font)

---

## 8. Database Scale Summary

- **60+ migrations** covering the full schema evolution (Dec 2025 – Mar 2026)
- **40+ Eloquent models** with rich relationships, scopes, and accessors
- **UUID primary keys** on all tables
- **9 factories** for test data generation
- **26 seeders** for roles, permissions, and demo data

---

## 9. Testing & Quality Assurance

| Layer | Tool | Coverage |
|-------|------|----------|
| **Backend Unit Tests** | Pest PHP 4.1 | Unit tests for services, actions, strategies |
| **Backend Feature Tests** | Pest PHP | Integration tests for controllers, middleware, security |
| **Frontend Unit Tests** | Jest 30 | Component and utility testing |
| **Frontend E2E Tests** | Playwright | Full user flow testing |
| **Component Docs** | Storybook 8.6 | UI component documentation and visual testing |
| **CI/CD** | GitHub Actions | 3 workflows: backend quality, frontend quality, security scanning |

---

*Analysis generated from exhaustive codebase review of all routes, controllers, models, migrations, services, middleware, frontend pages, components, hooks, and infrastructure configuration.*
