# Enums Reference

This document provides a comprehensive reference for all enumerations used in the backend application.

## Overview

All enums in the application are backed by string values (`string-backed enums`) for database storage and API serialization. Enums are located in the `App\Domains\{Domain}\Enums` namespace.

## Usage

### In Code
```php
use App\Domains\Auth\Enums\UserRole;

$role = UserRole::TEACHER;
echo $role->value;    // 'teacher'
echo $role->label(); // 'مدرس'
```

### In API Responses
```json
{
    "role": "teacher",
    "role_label": "مدرس"
}
```

### In Database
Enum values are stored as strings in the database:
```sql
-- migrations
$table->enum('status', ['active', 'suspended', 'pending']);
```

---

## Auth Domain

### UserRole

Defines user roles in the system.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `SUPER_ADMIN` | `super_admin` | مدير النظام | System administrator with full access |
| `ADMIN` | `admin` | مشرف | Supervisor with management access |
| `ORG_ADMIN` | `org_admin` | مدير المنظمة | Organization administrator |
| `TEACHER` | `teacher` | مدرس | Teacher/instructor |
| `SECRETARY` | `secretary` | سكرتير | Secretary assistant |
| `STUDENT` | `student` | طالب | Student |
| `PARENT` | `parent` | ولي أمر | Parent/Guardian |

**Methods:**
- `label(): string` - Returns Arabic label
- `isManagementRole(): bool` - Returns true for roles that can manage content (SUPER_ADMIN, ADMIN, ORG_ADMIN, TEACHER, SECRETARY)

**Location:** [`App\Domains\Auth\Enums\UserRole`](../../backend/app/Domains/Auth/Enums/UserRole.php)

---

### TeacherStatus

Defines the status of a teacher account.

| Case | Value | Description |
|------|-------|-------------|
| `ACTIVE` | `active` | Teacher is active and can access the system |
| `SUSPENDED` | `suspended` | Teacher account is suspended |
| `PENDING` | `pending` | Teacher registration pending approval |

**Location:** [`App\Domains\Auth\Enums\TeacherStatus`](../../backend/app/Domains/Auth/Enums/TeacherStatus.php)

---

### StudentGender

Defines student gender for grouping purposes.

| Case | Value | Description |
|------|-------|-------------|
| `MALE` | `male` | Male student |
| `FEMALE` | `female` | Female student |

**Location:** [`App\Domains\Auth\Enums\StudentGender`](../../backend/app/Domains/Auth/Enums/StudentGender.php)

---

### StudentEducationType

Defines the type of education system.

| Case | Value | Description |
|------|-------|-------------|
| `GENERAL` | `general` | General education system |
| `AZHAR` | `azhar` | Al-Azhar education system |

**Location:** [`App\Domains\Auth\Enums\StudentEducationType`](../../backend/app/Domains/Auth/Enums/StudentEducationType.php)

---

### OrganizationType

Defines types of organizations.

| Case | Value | Label (AR) |
|------|-------|------------|
| `ACADEMY` | `academy` | مركز تعليمي |
| `PRIVATE_SCHOOL` | `private_school` | مدرسة خاصة |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Auth\Enums\OrganizationType`](../../backend/app/Domains/Auth/Enums/OrganizationType.php)

---

### DeviceType

Defines device types for FCM notifications.

| Case | Value | Description |
|------|-------|-------------|
| `ANDROID` | `android` | Android device |
| `IOS` | `ios` | iOS device |
| `WEB` | `web` | Web browser |

**Location:** [`App\Domains\Auth\Enums\DeviceType`](../../backend/app/Domains/Auth/Enums/DeviceType.php)

---

### TeacherAttendanceStatus

Defines teacher check-in/check-out status.

| Case | Value | Description |
|------|-------|-------------|
| `CHECKED_IN` | `checked_in` | Teacher has checked in |
| `CHECKED_OUT` | `checked_out` | Teacher has checked out |
| `ABSENT` | `absent` | Teacher is absent |

**Location:** [`App\Domains\Auth\Enums\TeacherAttendanceStatus`](../../backend/app/Domains/Auth/Enums/TeacherAttendanceStatus.php)

---

## Exams Domain

### ExamStatus

Defines the lifecycle status of an exam.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `DRAFT` | `draft` | مسودة | Exam is being prepared |
| `ACTIVE` | `active` | نشط | Exam is active and can be taken |
| `CLOSED` | `closed` | منتهي | Exam has ended |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Exams\Enums\ExamStatus`](../../backend/app/Domains/Exams/Enums/ExamStatus.php)

---

### QuestionType

Defines types of exam questions.

| Case | Value | Label (AR) | Auto-Graded |
|------|-------|------------|-------------|
| `MCQ` | `mcq` | اختيار من متعدد | Yes |
| `TRUE_FALSE` | `true_false` | صح أو غلط | Yes |
| `ESSAY` | `essay` | مقالي | No |

**Methods:**
- `label(): string` - Returns Arabic label
- `isAutoGraded(): bool` - Returns true if question type can be auto-graded

**Location:** [`App\Domains\Exams\Enums\QuestionType`](../../backend/app/Domains/Exams/Enums/QuestionType.php)

---

### ExamMode

Defines the mode/purpose of an exam.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `PRACTICE` | `practice` | تدريب | Practice quiz |
| `EXAM` | `exam` | امتحان | Formal exam |
| `HOMEWORK` | `homework` | واجب | Homework assignment |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Exams\Enums\ExamMode`](../../backend/app/Domains/Exams/Enums/ExamMode.php)

---

### ExamAttemptStatus

Defines the status of an exam attempt.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `IN_PROGRESS` | `in_progress` | جاري | Student is currently taking the exam |
| `COMPLETED` | `completed` | مكتمل | Exam completed successfully |
| `TERMINATED` | `terminated` | منتهي قسراً | Exam was forcibly terminated |
| `FLAGGED` | `flagged` | مشبوه | Exam flagged for review |

**Methods:**
- `label(): string` - Returns Arabic label
- `isFinished(): bool` - Returns true if attempt is in a finished state

**Location:** [`App\Domains\Exams\Enums\ExamAttemptStatus`](../../backend/app/Domains/Exams/Enums/ExamAttemptStatus.php)

---

## Subscriptions Domain

### SubscriptionStatus

Defines subscription lifecycle status.

| Case | Value | Label (AR) | Color | Description |
|------|-------|------------|-------|-------------|
| `ACTIVE` | `active` | نشط | success | Subscription is active |
| `PENDING` | `pending` | غير مدفوع | warning | Awaiting payment |
| `PARTIAL` | `partial` | مدفوع جزئياً | info | Partially paid |
| `PAID` | `paid` | مدفوع | success | Fully paid |
| `EXPIRED` | `expired` | منتهي | danger | Subscription expired |
| `CANCELLED` | `cancelled` | ملغي | secondary | Subscription cancelled |

**Methods:**
- `label(): string` - Returns Arabic label
- `color(): string` - Returns UI color class

**Location:** [`App\Domains\Subscriptions\Enums\SubscriptionStatus`](../../backend/app/Domains/Subscriptions/Enums/SubscriptionStatus.php)

---

### SubscriptionType

Defines types of subscriptions.

| Case | Value | Label (AR) | Price Setting Key |
|------|-------|------------|-------------------|
| `TEACHER` | `teacher` | مدرس | `pricePerStudent` |
| `ACADEMY` | `academy` | أكاديمية | `academy_student_price` |

**Methods:**
- `label(): string` - Returns Arabic label
- `priceSettingKey(): string` - Returns the setting key for price

**Location:** [`App\Domains\Subscriptions\Enums\SubscriptionType`](../../backend/app/Domains/Subscriptions/Enums/SubscriptionType.php)

---

### PaymentMethod

Defines available payment methods.

| Case | Value | Description |
|------|-------|-------------|
| `ADMIN` | `admin` | Admin-recorded payment |

**Location:** [`App\Domains\Subscriptions\Enums\PaymentMethod`](../../backend/app/Domains/Subscriptions/Enums/PaymentMethod.php)

---

### PaymentLogStatus

Defines payment log status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING` | `pending` | Payment pending |
| `CONFIRMED` | `confirmed` | Payment confirmed |
| `EXPIRED` | `expired` | Payment expired |
| `CANCELLED` | `cancelled` | Payment cancelled |

**Location:** [`App\Domains\Subscriptions\Enums\PaymentLogStatus`](../../backend/app/Domains/Subscriptions/Enums/PaymentLogStatus.php)

---

### TeacherSubscriptionStatus

Defines teacher-specific subscription status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING` | `pending` | Payment pending |
| `PARTIAL` | `partial` | Partially paid |
| `PAID` | `paid` | Fully paid |

**Location:** [`App\Domains\Subscriptions\Enums\TeacherSubscriptionStatus`](../../backend/app/Domains/Subscriptions/Enums/TeacherSubscriptionStatus.php)

---

### PeriodType

Defines billing period types.

| Case | Value | Label (AR) |
|------|-------|------------|
| `MONTHLY` | `monthly` | شهري |
| `YEARLY` | `yearly` | سنوي |
| `ONE_TIME` | `one_time` | مرة واحدة |
| `CUSTOM` | `custom` | مخصص |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Subscriptions\Enums\PeriodType`](../../backend/app/Domains/Subscriptions/Enums/PeriodType.php)

---

### PaymentPriceSource

Defines where payment price is derived from.

| Case | Value | Description |
|------|-------|-------------|
| `GRADE` | `grade` | Price from grade settings |
| `GROUP` | `group` | Price from group settings |

**Location:** [`App\Domains\Subscriptions\Enums\PaymentPriceSource`](../../backend/app/Domains/Subscriptions/Enums/PaymentPriceSource.php)

---

## Videos Domain

### VideoStatus

Defines the lifecycle status of a video.

| Case | Value | Description |
|------|-------|-------------|
| `DRAFT` | `draft` | Video is being prepared |
| `UPLOADING` | `uploading` | Video is being uploaded |
| `UPLOADED` | `uploaded` | Upload complete |
| `PROCESSING` | `processing` | Video is being processed |
| `READY` | `ready` | Video is ready for review |
| `SCHEDULED` | `scheduled` | Video scheduled for publication |
| `PUBLISHED` | `published` | Video is live |
| `FAILED` | `failed` | Processing failed |
| `DELETED` | `deleted` | Video deleted |

**Methods:**
- `isAccessible(): bool` - Returns true only if video is published

**Location:** [`App\Domains\Videos\Enums\VideoStatus`](../../backend/app/Domains/Videos/Enums/VideoStatus.php)

---

### VideoProcessingStatus

Defines video processing status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING` | `pending` | Processing queued |
| `RUNNING` | `running` | Processing in progress |
| `SUCCEEDED` | `succeeded` | Processing completed |
| `FAILED` | `failed` | Processing failed |

**Location:** [`App\Domains\Videos\Enums\VideoProcessingStatus`](../../backend/app/Domains/Videos/Enums/VideoProcessingStatus.php)

---

### VideoUploadSessionStatus

Defines multipart upload session status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING_UPLOAD` | `pending_upload` | Session created, awaiting parts |
| `UPLOADING` | `uploading` | Parts being uploaded |
| `COMPLETING` | `completing` | Finalizing upload |
| `COMPLETED` | `completed` | Upload complete |
| `ABORTED` | `aborted` | Upload aborted |
| `FAILED` | `failed` | Upload failed |

**Methods:**
- `isTerminal(): bool` - Returns true if session is in a terminal state

**Location:** [`App\Domains\Videos\Enums\VideoUploadSessionStatus`](../../backend/app/Domains/Videos/Enums/VideoUploadSessionStatus.php)

---

### VideoOwnerType

Defines who owns a video.

| Case | Value | Description |
|------|-------|-------------|
| `INDEPENDENT_TEACHER` | `independent_teacher` | Independent teacher's video |
| `ACADEMY` | `academy` | Academy's video |

**Location:** [`App\Domains\Videos\Enums\VideoOwnerType`](../../backend/app/Domains/Videos/Enums/VideoOwnerType.php)

---

### VideoWatchStatus

Defines student's video watch progress.

| Case | Value | Description |
|------|-------|-------------|
| `NOT_STARTED` | `not_started` | Student hasn't started watching |
| `STARTED` | `started` | Student started watching |
| `IN_PROGRESS` | `in_progress` | Student is watching |
| `WATCHED_PENDING_QUIZ` | `watched_pending_quiz` | Watched completely, quiz pending |
| `COMPLETED` | `completed` | Watched and quiz passed (or no quiz) |

**Location:** [`App\Domains\Videos\Enums\VideoWatchStatus`](../../backend/app/Domains/Videos/Enums/VideoWatchStatus.php)

---

## Lectures Domain

### LectureStatus

Defines lecture lifecycle status.

| Case | Value | Label (AR) | Color |
|------|-------|------------|-------|
| `SCHEDULED` | `scheduled` | مجدولة | info |
| `ACTIVE` | `active` | نشطة | success |
| `CLOSED` | `closed` | منتهية | secondary |
| `CANCELLED` | `cancelled` | ملغاة | danger |

**Methods:**
- `label(): string` - Returns Arabic label
- `color(): string` - Returns UI color class

**Location:** [`App\Domains\Lectures\Enums\LectureStatus`](../../backend/app/Domains/Lectures/Enums/LectureStatus.php)

---

### AttendanceStatus

Defines student attendance status for lectures.

| Case | Value | Label (AR) | Color |
|------|-------|------------|-------|
| `PRESENT` | `present` | حاضر | success |
| `ABSENT` | `absent` | غائب | danger |
| `LATE` | `late` | متأخر | warning |
| `EXCUSED` | `excused` | مستأذن | info |

**Methods:**
- `label(): string` - Returns Arabic label
- `color(): string` - Returns UI color class

**Location:** [`App\Domains\Lectures\Enums\AttendanceStatus`](../../backend/app/Domains/Lectures/Enums/AttendanceStatus.php)

---

### AttendanceMethod

Defines how attendance was recorded.

| Case | Value | Label (AR) |
|------|-------|------------|
| `QR_CODE` | `qr_code` | QR Code |
| `MANUAL` | `manual` | يدوي |
| `AUTO` | `auto` | تلقائي |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Lectures\Enums\AttendanceMethod`](../../backend/app/Domains/Lectures/Enums/AttendanceMethod.php)

---

### StudentAttendanceStatus

Simplified student attendance status.

| Case | Value | Description |
|------|-------|-------------|
| `PRESENT` | `present` | Student present |
| `ABSENT` | `absent` | Student absent |
| `LATE` | `late` | Student late |

**Location:** [`App\Domains\Lectures\Enums\StudentAttendanceStatus`](../../backend/app/Domains/Lectures/Enums/StudentAttendanceStatus.php)

---

## Enrollments Domain

### EnrollmentStatus

Defines student enrollment status.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `ACTIVE` | `active` | نشط | Enrollment is active |
| `SUSPENDED` | `suspended` | موقوف | Enrollment suspended |
| `EXPIRED` | `expired` | منتهي | Enrollment expired |
| `BLOCKED_BY_PLAN` | `blocked_by_plan` | محظور بسبب الباقة | Blocked by subscription plan |

**Methods:**
- `label(): string` - Returns Arabic label
- `isActive(): bool` - Returns true if enrollment is active

**Location:** [`App\Domains\Enrollments\Enums\EnrollmentStatus`](../../backend/app/Domains/Enrollments/Enums/EnrollmentStatus.php)

---

### GroupType

Defines group visibility type.

| Case | Value | Label (AR) |
|------|-------|------------|
| `PUBLIC` | `public` | عام |
| `PRIVATE` | `private` | خاص |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Enrollments\Enums\GroupType`](../../backend/app/Domains/Enrollments/Enums/GroupType.php)

---

### SeatStatus

Defines seat allocation status.

| Case | Value | Label (AR) |
|------|-------|------------|
| `ACTIVE` | `active` | نشط |
| `SUSPENDED` | `suspended` | موقوف |
| `RELEASED` | `released` | محرر |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Enrollments\Enums\SeatStatus`](../../backend/app/Domains/Enrollments/Enums/SeatStatus.php)

---

### StudentActivityAction

Defines types of student activity log actions.

| Case | Value | Description |
|------|-------|-------------|
| `ENROLLED` | `enrolled` | Student enrolled |
| `UNENROLLED` | `unenrolled` | Student unenrolled |
| `GROUP_CHANGE` | `group_change` | Group changed |
| `GRADE_CHANGE` | `grade_change` | Grade changed |
| `PAYMENT` | `payment` | Payment recorded |
| `DEDUCTION` | `deduction` | Deduction applied |
| `MERGED` | `merged` | Student merged |
| `STATUS_CHANGE` | `status_change` | Status changed |

**Location:** [`App\Domains\Enrollments\Enums\StudentActivityAction`](../../backend/app/Domains/Enrollments/Enums/StudentActivityAction.php)

---

## Notifications Domain

### NotificationType

Defines notification severity types.

| Case | Value | Description |
|------|-------|-------------|
| `INFO` | `info` | Informational notification |
| `WARNING` | `warning` | Warning notification |
| `SUCCESS` | `success` | Success notification |
| `DANGER` | `danger` | Critical/danger notification |

**Location:** [`App\Domains\Notifications\Enums\NotificationType`](../../backend/app/Domains/Notifications/Enums/NotificationType.php)

---

### NotificationTargetType

Defines notification target audience.

| Case | Value | Description |
|------|-------|-------------|
| `TEACHERS` | `teachers` | Send to teachers only |
| `SECRETARIES` | `secretaries` | Send to secretaries only |
| `ALL` | `all` | Send to all staff |

**Location:** [`App\Domains\Notifications\Enums\NotificationTargetType`](../../backend/app/Domains/Notifications/Enums/NotificationTargetType.php)

---

### AnnouncementContentType

Defines content type for announcements.

| Case | Value | Label (AR) |
|------|-------|------------|
| `TEXT` | `text` | نص |
| `IMAGE` | `image` | صورة |
| `VIDEO` | `video` | فيديو |
| `VOICE` | `voice` | صوت |
| `FILE` | `file` | ملف |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Notifications\Enums\AnnouncementContentType`](../../backend/app/Domains/Notifications/Enums/AnnouncementContentType.php)

---

## Gamification Domain

### QuestType

Defines quest/challenge types.

| Case | Value | Label (AR) |
|------|-------|------------|
| `DAILY` | `daily` | يومية |
| `WEEKLY` | `weekly` | أسبوعية |
| `MONTHLY` | `monthly` | شهرية |
| `SPECIAL` | `special` | خاصة |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Gamification\Enums\QuestType`](../../backend/app/Domains/Gamification/Enums/QuestType.php)

---

### PointTransactionType

Defines types of point transactions.

| Case | Value | Description |
|------|-------|-------------|
| `ATTENDANCE` | `attendance` | Attendance points |
| `PERFECT_MONTH` | `perfect_month` | Perfect month bonus |
| `EXAM_SCORE` | `exam_score` | Exam score points |
| `EXAM_RETAKE_BONUS` | `exam_retake_bonus` | Exam retake success bonus |
| `EXAM_FIRST_PLACE` | `exam_first_place` | First place in exam |
| `STREAK_5` | `streak_5` | 5-session streak |
| `STREAK_10` | `streak_10` | 10-session streak |
| `MANUAL_BONUS` | `manual_bonus` | Manual bonus from teacher |
| `VIDEO_WATCHED` | `video_watched` | Video fully watched |
| `VIDEO_QUIZ_PASSED` | `video_quiz_passed` | Video quiz passed |
| `VIDEO_QUIZ_PERFECT` | `video_quiz_perfect` | Video quiz perfect score |
| `VIDEO_FIRST_WATCH` | `video_first_watch` | First to watch video |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Gamification\Enums\PointTransactionType`](../../backend/app/Domains/Gamification/Enums/PointTransactionType.php)

---

## Application Domain

### AuditAction

Defines audit log action types.

| Case | Value | Label (AR) |
|------|-------|------------|
| `CREATED` | `created` | أُنشئ |
| `UPDATED` | `updated` | عُدِّل |
| `DELETED` | `deleted` | حُذف |
| `RESTORED` | `restored` | استُرجع |
| `LOGGED_IN` | `logged_in` | تسجيل دخول |
| `LOGGED_OUT` | `logged_out` | تسجيل خروج |
| `EXPORTED` | `exported` | تصدير |
| `ROLE_CHANGED` | `role_changed` | تغيير دور |
| `PERMISSION_CHANGED` | `permission_changed` | تغيير صلاحية |
| `PASSWORD_CHANGED` | `password_changed` | تغيير كلمة المرور |
| `SUSPENDED` | `suspended` | إيقاف |
| `ACTIVATED` | `activated` | تفعيل |

**Methods:**
- `label(): string` - Returns Arabic label

**Location:** [`App\Domains\Application\Enums\AuditAction`](../../backend/app/Domains/Application/Enums/AuditAction.php)

---

## Best Practices

### Adding New Enum Cases

1. Add the case to the enum class
2. Update any `match` expressions in helper methods
3. Update database migrations if needed
4. Update this documentation

### Validation

Use enum validation in Form Requests:

```php
use Illuminate\Validation\Rule;
use App\Domains\Exams\Enums\ExamStatus;

public function rules(): array
{
    return [
        'status' => ['required', Rule::enum(ExamStatus::class)],
    ];
}
```

### Casting in Models

```php
use App\Domains\Exams\Enums\ExamStatus;

protected $casts = [
    'status' => ExamStatus::class,
];
```

## References

- [PHP 8.1 Enums](https://www.php.net/manual/en/language.enumerations.php)
- [Laravel Enum Casting](https://laravel.com/docs/11.x/eloquent-mutators#enum-casting)
