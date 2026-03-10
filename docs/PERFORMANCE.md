# Performance Optimization

## Overview

This document describes the performance optimizations implemented in the Laravel Backend LMS project, including database indexes, query optimizations, and background jobs.

## Database Indexes

### Performance Index Migration

The project includes a dedicated migration for performance indexes: [`add_performance_indexes`](../backend/database/migrations/2026_02_07_000001_add_performance_indexes.php).

### Students Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `students_created_at_index` | `created_at` | Filter by creation date |
| `students_name_index` | `name` | Search by name |
| `phone` | `phone` | Lookup by phone number |
| `guardian_id` | `guardian_id` | Filter by guardian |

### Teachers Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `phone` | `phone` | Lookup by phone number |
| `id` | `id` | Primary key lookup |

### Lectures Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `lectures_teacher_active_index` | `teacher_id`, `is_active` | Filter active lectures by teacher |
| `lectures_grade_active_index` | `grade_id`, `is_active` | Filter active lectures by grade |
| `idx_lectures_teacher_date` | `teacher_id`, `start_time`, `is_active` | Filter lectures by teacher and date |
| `lectures_teacher_start_time_index` | `teacher_id`, `start_time` | Filter by teacher and time |
| `lectures_academy_start_time_index` | `academy_id`, `start_time` | Filter by academy and time |
| `lectures_is_active_index` | `is_active` | Filter active lectures |
| `lectures_grade_id_index` | `grade_id` | Filter by grade |
| `lectures_start_time_index` | `start_time` | Filter by time |
| `qr_code` | `qr_code` | QR code lookup (unique) |

### Exams Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `exams_teacher_active_index` | `teacher_id`, `is_active` | Filter active exams by teacher |
| `exams_grade_group_index` | `grade_id`, `group_id` | Filter exams by grade and group |
| `exams_is_active_index` | `is_active` | Filter active exams |
| `exams_date_index` | `date` | Filter by exam date |

### Enrollments Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `student_id` | `student_id` | Filter by student |
| `teacher_id` | `teacher_id` | Filter by teacher |
| `academy_id` | `academy_id` | Filter by academy |
| `enrollments_teacher_active_index` | `teacher_id`, `is_active` | Filter active enrollments by teacher |
| `enrollments_grade_active_index` | `grade_id`, `is_active` | Filter active enrollments by grade |
| `idx_enrollments_lookup` | `teacher_id`, `grade_id`, `is_active` | Multi-column lookup |
| `enrollment_context_unique` | `student_id`, `teacher_id`, `academy_id` | Unique constraint |

### Exam Results Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `exam_results_exam_student_index` | `exam_id`, `student_id` | Lookup by exam and student |
| `idx_exam_results_lookup` | `exam_id`, `student_id` | Alternative lookup |
| `idx_exam_results_student` | `student_id`, `created_at` | Filter by student and date |

### Exam Attempts Table

| Unique Constraint | Columns | Purpose |
|------------------|---------|---------|
| - | `exam_id`, `student_id` | Prevent multiple attempts |

### Student Answers Table

| Unique Constraint | Columns | Purpose |
|------------------|---------|---------|
| - | `exam_attempt_id`, `question_id` | One answer per question per attempt |

### Notifications Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `notifications_notifiable_read_index` | `notifiable_id`, `notifiable_type`, `read_at` | Filter unread notifications |
| `notifications_created_at_index` | `created_at` | Filter by date |
| `notifications_type_index` | `type` | Filter by type |
| `notifiable_type`, `notifiable_id` | `notifiable_type`, `notifiable_id` | Polymorphic lookup |

### Student Points Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `student_id`, `teacher_id` | `student_id`, `teacher_id` | Unique constraint |
| `teacher_id`, `total_points` | `teacher_id`, `total_points` | Leaderboard queries |

### Point Transactions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `student_id`, `teacher_id` | `student_id`, `teacher_id` | Filter by student and teacher |
| `idx_point_transactions_teacher_created` | `teacher_id`, `created_at` | Filter by teacher and date |
| `idx_point_transactions_student_teacher` | `student_id`, `teacher_id` | Alternative lookup |
| `created_at` | `created_at` | Filter by date |
| `type` | `type` | Filter by transaction type |

### Student Failed Questions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `student_id`, `question_id` | `student_id`, `question_id` | Unique constraint |
| `student_id`, `teacher_id`, `is_mastered` | `student_id`, `teacher_id`, `is_mastered` | Filter mastered questions |

### Attendances Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `attendances_lecture_date_index` | `lecture_id`, `created_at` | Filter by lecture and date |
| `attendances_student_date_index` | `student_id`, `created_at` | Filter by student and date |
| `idx_attendance_lecture` | `lecture_id`, `status` | Filter by lecture and status |
| `idx_attendance_student` | `student_id`, `lecture_id` | Lookup by student and lecture |

### Teacher Attendance Logs Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `academy_id`, `teacher_id`, `date` | `academy_id`, `teacher_id`, `date` | Multi-column lookup |
| `attendance_academy_date_index` | `academy_id`, `date` | Filter by academy and date |
| `attendance_teacher_date_index` | `teacher_id`, `date` | Filter by teacher and date |
| `attendance_status_index` | `status` | Filter by status |
| `attendance_date_index` | `date` | Filter by date |

### Payment Logs Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `student_id`, `status` | `student_id`, `status` | Filter by student and status |
| `teacher_id`, `status` | `teacher_id`, `status` | Filter by teacher and status |
| `confirmation_code`, `student_id` | `confirmation_code`, `student_id` | Code lookup per student |
| `idx_payment_logs_confirmed` | `teacher_id`, `status`, `confirmed_at` | Filter confirmed payments |
| `idx_payment_logs_student` | `student_id`, `teacher_id`, `status` | Multi-column lookup |
| `confirmation_code` | `confirmation_code` | Code lookup |

### Subscriptions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `subscriber_type`, `status` | `subscriber_type`, `status` | Filter by type and status |
| `month`, `status` | `month`, `status` | Filter by month and status |
| `subscriber_id`, `subscriber_type`, `month` | `subscriber_id`, `subscriber_type`, `month` | Unique constraint |

### Academy Subscriptions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `academy_id`, `month` | `academy_id`, `month` | Filter by academy and month |

### Teacher Subscriptions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `teacher_id`, `month` | `teacher_id`, `month` | Filter by teacher and month |

### Student Activity Logs Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `student_id` | `student_id` | Filter by student |
| `enrollment_id` | `enrollment_id` | Filter by enrollment |
| `action` | `action` | Filter by action |
| `created_at` | `created_at` | Filter by date |

### Login Attempts Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `identifier`, `ip_address` | `identifier`, `ip_address` | Filter by identifier and IP |

### Sessions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `user_id` | `user_id` | Filter by user |
| `last_activity` | `last_activity` | Filter by activity |

### Videos Tables

| Index | Columns | Purpose |
|-------|---------|---------|
| `academy_id` | `academy_id` | Filter by academy |
| `lesson_id` | `lesson_id` | Filter by lesson |
| `owner_type`, `owner_id` | `owner_type`, `owner_id` | Polymorphic lookup |
| `status`, `published_at` | `status`, `published_at` | Filter by status and date |
| `academy_id`, `status` | `academy_id`, `status` | Filter by academy and status |
| `teacher_reference_id`, `status` | `teacher_reference_id`, `status` | Filter by teacher and status |
| `video_id`, `mime_type` | `video_id`, `mime_type` | Filter by video and type |
| `student_id`, `revoked_at` | `student_id`, `revoked_at` | Filter by student and revocation |
| `student_id`, `status` | `student_id`, `status` | Filter by student and status |
| `video_id`, `parent_id` | `video_id`, `parent_id` | Filter by video and parent |
| `video_id`, `is_hidden` | `video_id`, `is_hidden` | Filter hidden comments |
| `student_id`, `expires_at` | `student_id`, `expires_at` | Filter by student and expiration |
| `student_id`, `device_fingerprint` | `student_id`, `device_fingerprint` | Filter by student and device |
| `video_id`, `student_id` | `video_id`, `student_id` | Filter by video and student |
| `action`, `result`, `created_at` | `action`, `result`, `created_at` | Filter by action and result |
| `next_reminder_at`, `stopped_at` | `next_reminder_at`, `stopped_at` | Filter reminders |
| `video_id`, `is_active` | `video_id`, `is_active` | Filter active quizzes |
| `teacher_id` | `teacher_id` | Filter by teacher |
| `video_quiz_id`, `sort_order` | `video_quiz_id`, `sort_order` | Order quiz questions |
| `video_quiz_id`, `student_id`, `status` | `video_quiz_id`, `student_id`, `status` | Filter quiz attempts |
| `student_id`, `status` | `student_id`, `status` | Filter by student and status |

### Video Quiz Tables

| Index | Columns | Purpose |
|-------|---------|---------|
| `video_id`, `is_active` | `video_id`, `is_active` | Filter active quizzes |
| `teacher_id` | `teacher_id` | Filter by teacher |
| `video_quiz_id`, `sort_order` | `video_quiz_id`, `sort_order` | Order questions |
| `video_quiz_id`, `student_id`, `status` | `video_quiz_id`, `student_id`, `status` | Filter attempts |
| `student_id`, `status` | `student_id`, `status` | Filter by student and status |

### Video Upload Sessions Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `status` | `status` | Filter by status |
| `uploader_type`, `uploader_id` | `uploader_type`, `uploader_id` | Polymorphic lookup |
| `video_id`, `status` | `video_id`, `status` | Filter by video and status |
| `created_at` | `created_at` | Filter by date |

### Settings Table

| Index | Columns | Purpose |
|-------|---------|---------|
| `key` | `key` | Lookup by key (unique) |
| `group` | `group` | Filter by group |

## Query Optimizations

### Eager Loading

Always use eager loading to prevent N+1 queries:

```php
// ✅ Good - Eager loading
$students = Student::with('grade', 'group', 'teacher')->get();

// ❌ Bad - N+1 queries
$students = Student::get();
foreach ($students as $student) {
    $student->grade; // Separate query for each student
}
```

### Select Only Needed Columns

Select only the columns you need:

```php
// ✅ Good - Select specific columns
$students = Student::select('id', 'name', 'phone')->get();

// ❌ Bad - Select all columns
$students = Student::get();
```

### Use Indexes in Queries

Ensure queries use indexes:

```php
// ✅ Good - Uses index
$lectures = Lecture::where('teacher_id', $teacherId)
    ->where('is_active', true)
    ->where('start_time', '>=', now())
    ->get();

// ❌ Bad - May not use index efficiently
$lectures = Lecture::where('start_time', '>=', now())
    ->where('teacher_id', $teacherId)
    ->where('is_active', true)
    ->get();
```

### Chunk Large Result Sets

Use chunking for large result sets:

```php
// ✅ Good - Chunk processing
Student::chunk(1000, function ($students) {
    foreach ($students as $student) {
        // Process student
    }
});

// ❌ Bad - Load all at once
$students = Student::all();
foreach ($students as $student) {
    // Process student
}
```

### Use Cursor for Large Iterations

Use cursor for memory-efficient iteration:

```php
// ✅ Good - Cursor iteration
foreach (Student::cursor() as $student) {
    // Process student
}

// ❌ Bad - Load all into memory
$students = Student::all();
foreach ($students as $student) {
    // Process student
}
```

### Use Aggregations

Use database aggregations instead of PHP:

```php
// ✅ Good - Database aggregation
$count = Student::where('teacher_id', $teacherId)->count();

// ❌ Bad - PHP aggregation
$count = count(Student::where('teacher_id', $teacherId)->get());
```

### Use Exists Instead of Count

Use exists() instead of count() for existence checks:

```php
// ✅ Good - Exists check
$hasStudents = Student::where('teacher_id', $teacherId)->exists();

// ❌ Bad - Count check
$hasStudents = Student::where('teacher_id', $teacherId)->count() > 0;
```

### Use Pluck Instead of Loop

Use pluck() for extracting values:

```php
// ✅ Good - Pluck
$studentIds = Student::pluck('id');

// ❌ Bad - Loop
$studentIds = [];
foreach (Student::get() as $student) {
    $studentIds[] = $student->id;
}
```

## Background Jobs

### Job Queue Configuration

Jobs are processed using Laravel Horizon. Configure queues in `config/horizon.php`.

### Exam Jobs

#### ProcessExamStart
**Location:** [`backend/app/Domains/Exams/Jobs/ProcessExamStart.php`](../backend/app/Domains/Exams/Jobs/ProcessExamStart.php)

**Purpose:** Process exam start events asynchronously

**Queue:** `exams`

**Usage:**
```php
ProcessExamStart::dispatch($examAttempt);
```

#### ProcessExamEnd
**Location:** [`backend/app/Domains/Exams/Jobs/ProcessExamEnd.php`](../backend/app/Domains/Exams/Jobs/ProcessExamEnd.php)

**Purpose:** Process exam completion and calculate results

**Queue:** `exams`

**Usage:**
```php
ProcessExamEnd::dispatch($examAttempt);
```

### Gamification Jobs

#### RecalculateLeaderboard
**Location:** [`backend/app/Domains/Gamification/Jobs/RecalculateLeaderboard.php`](../backend/app/Domains/Gamification/Jobs/RecalculateLeaderboard.php)

**Purpose:** Recalculate and cache leaderboards

**Queue:** `gamification`

**Usage:**
```php
RecalculateLeaderboard::dispatch($teacherId);
```

### Media Jobs

#### ProcessMediaUpload
**Location:** [`backend/app/Domains/Media/Jobs/ProcessMediaUpload.php`](../backend/app/Domains/Media/Jobs/ProcessMediaUpload.php)

**Purpose:** Process media uploads asynchronously

**Queue:** `media`

**Usage:**
```php
ProcessMediaUpload::dispatch($media, $file);
```

### Notification Jobs

#### SendBulkNotificationJob
**Location:** [`backend/app/Domains/Notifications/Jobs/SendBulkNotificationJob.php`](../backend/app/Domains/Notifications/Jobs/SendBulkNotificationJob.php)

**Purpose:** Send bulk notifications asynchronously

**Queue:** `notifications`

**Usage:**
```php
SendBulkNotificationJob::dispatch($notificationData, $recipients);
```

### Report Jobs

#### GenerateReportJob
**Location:** [`backend/app/Domains/Reports/Jobs/GenerateReportJob.php`](../backend/app/Domains/Reports/Jobs/GenerateReportJob.php)

**Purpose:** Generate reports asynchronously

**Queue:** `reports`

**Usage:**
```php
GenerateReportJob::dispatch($reportData);
```

### Video Jobs

#### ProcessUploadedVideoJob
**Location:** [`backend/app/Domains/Videos/Jobs/ProcessUploadedVideoJob.php`](../backend/app/Domains/Videos/Jobs/ProcessUploadedVideoJob.php)

**Purpose:** Process uploaded videos

**Queue:** `videos`

**Usage:**
```php
ProcessUploadedVideoJob::dispatch($video);
```

#### PublishScheduledVideoJob
**Location:** [`backend/app/Domains/Videos/Jobs/PublishScheduledVideoJob.php`](../backend/app/Domains/Videos/Jobs/PublishScheduledVideoJob.php)

**Purpose:** Publish scheduled videos

**Queue:** `videos`

**Usage:**
```php
PublishScheduledVideoJob::dispatch($video);
```

#### ProcessDueVideoRemindersJob
**Location:** [`backend/app/Domains/Videos/Jobs/ProcessDueVideoRemindersJob.php`](../backend/app/Domains/Videos/Jobs/ProcessDueVideoRemindersJob.php)

**Purpose:** Process due video reminders

**Queue:** `videos`

**Usage:**
```php
ProcessDueVideoRemindersJob::dispatch();
```

#### RevokeExpiredVideoPlaybackTokensJob
**Location:** [`backend/app/Domains/Videos/Jobs/RevokeExpiredVideoPlaybackTokensJob.php`](../backend/app/Domains/Videos/Jobs/RevokeExpiredVideoPlaybackTokensJob.php)

**Purpose:** Revoke expired video playback tokens

**Queue:** `videos`

**Usage:**
```php
RevokeExpiredVideoPlaybackTokensJob::dispatch();
```

## Job Best Practices

### 1. Use Appropriate Queues

Assign jobs to appropriate queues for better management:

```php
// ✅ Good - Specific queue
ProcessExamEnd::dispatch($attempt)->onQueue('exams');

// ❌ Bad - Default queue
ProcessExamEnd::dispatch($attempt);
```

### 2. Set Job Timeouts

Set appropriate timeouts for long-running jobs:

```php
public $timeout = 300; // 5 minutes
```

### 3. Use Job Batching

Batch related jobs:

```php
Bus::batch([
    new ProcessExamStart($attempt1),
    new ProcessExamStart($attempt2),
    new ProcessExamStart($attempt3),
])->dispatch();
```

### 4. Handle Failures

Implement failure handling:

```php
public function failed(Throwable $exception): void
{
    Log::error('Job failed', ['exception' => $exception->getMessage()]);
    // Notify admin
}
```

### 5. Use Rate Limiting

Rate limit external API calls:

```php
use Illuminate\Bus\Batchable;
use Illuminate\Support\Facades\RateLimiter;

public function handle(): void
{
    RateLimiter::attempt('api-calls', 10, function () {
        // Make API call
    }, 60);
}
```

## Performance Monitoring

### Laravel Telescope

Use Laravel Telescope for monitoring:

- Request monitoring
- Query monitoring
- Job monitoring
- Cache monitoring

### Laravel Horizon

Use Laravel Horizon for job queue monitoring:

- Job throughput
- Failed jobs
- Queue wait times
- Worker status

### Database Query Logging

Enable query logging in development:

```php
DB::listen(function ($query) {
    Log::info($query->sql, $query->bindings);
});
```

### Slow Query Logging

Log slow queries:

```php
DB::listen(function ($query) {
    if ($query->time > 100) { // 100ms
        Log::warning('Slow query', [
            'sql' => $query->sql,
            'time' => $query->time,
        ]);
    }
});
```

## Performance Metrics

### Target Response Times

| Endpoint Type | Target Time |
|---------------|-------------|
| Simple GET | < 100ms |
| List with pagination | < 200ms |
| Complex query | < 500ms |
| POST/PUT/DELETE | < 300ms |

### Database Query Targets

| Query Type | Target Time |
|------------|-------------|
| Simple SELECT | < 10ms |
| JOIN query | < 50ms |
| Aggregation | < 100ms |
| Complex query | < 200ms |

### Job Processing Targets

| Job Type | Target Time |
|----------|-------------|
| Simple job | < 1s |
| Media processing | < 30s |
| Report generation | < 60s |
| Bulk operations | < 5m |

## Optimization Checklist

- [ ] All frequently queried columns have indexes
- [ ] N+1 queries eliminated with eager loading
- [ ] Only necessary columns selected
- [ ] Large result sets chunked
- [ ] Expensive operations queued
- [ ] Cache used for frequently accessed data
- [ ] Query logging enabled in development
- [ ] Slow queries identified and optimized
- [ ] Database statistics monitored
- [ ] Job queues monitored with Horizon
- [ ] Response times within targets
- [ ] Database query times within targets

## Troubleshooting

### Slow Queries

1. Check query with `EXPLAIN`
2. Verify indexes are used
3. Consider query refactoring
4. Add missing indexes

### High Memory Usage

1. Check for N+1 queries
2. Use chunking/cursor for large datasets
3. Select only needed columns
4. Use pagination

### Job Queue Backlog

1. Check Horizon for queue status
2. Scale workers if needed
3. Review job execution times
4. Optimize long-running jobs

### Cache Misses

1. Verify cache driver is configured
2. Check Redis connection
3. Review cache key patterns
4. Monitor cache hit rate
