---
title: Database Migrations
description: Database migration conventions, reference, and best practices for the Neetaq platform
---

# Database Migrations

Migrations manage the database schema in a version-controlled, reversible manner. All migrations use **UUID primary keys** and follow a domain-driven organization.

## Naming Conventions

Migration filenames follow Laravel's timestamp-based pattern:

```
YYYY_MM_DD_HHMMSS_descriptive_name.php
```

| Pattern | Description | Example |
|---------|-------------|---------|
| `create_{table}_table` | Create new table | `2025_12_10_000001_create_teachers_table.php` |
| `add_{column}_to_{table}` | Add column(s) | `2026_01_05_000001_add_voice_columns_to_sent_notifications.php` |
| `make_{columns}_nullable` | Make columns nullable | `2025_12_22_133813_make_payment_log_columns_nullable.php` |
| `add_{descriptive}_indexes` | Add database indexes | `2026_02_07_000001_add_performance_indexes.php` |

## Migration Categories

### Core User Tables

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_09_000000_create_academies_table` | `academies` | Educational institutions |
| `2025_12_10_000000_create_admins_table` | `admins` | Platform administrators |
| `2025_12_10_000001_create_teachers_table` | `teachers` | Independent teachers |
| `2025_12_10_000004_create_students_table` | `students` | Students enrolled in courses |
| `2025_12_10_000005_create_secretaries_table` | `secretaries` | Academy staff members |
| `2026_01_01_000001_create_guardians_table` | `guardians` | Parent/Guardian accounts |

### Educational Structure

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_10_000002_create_grades_table` | `grades` | Grade levels |
| `2025_12_10_000003_create_groups_table` | `groups` | Study groups within grades |
| `2025_12_12_000001_create_enrollments_table` | `enrollments` | Student-teacher relationships |
| `2026_01_08_000002_create_academy_secretary_table` | `academy_secretary` | Academy-secretary pivot |
| `2026_01_08_000003_create_academy_teacher_table` | `academy_teacher` | Academy-teacher pivot |
| `2025_12_26_182135_create_secretary_teacher_table` | `secretary_teacher` | Secretary-teacher pivot |

### Content and Assessment

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_10_000006_create_lectures_table` | `lectures` | Lecture sessions |
| `2026_01_06_132143_create_lecture_sessions_table` | `lecture_sessions` | Recurring lecture instances |
| `2025_12_10_000007_create_exams_table` | `exams` | Examinations |
| `2025_12_10_000008_create_questions_table` | `questions` | Exam questions |
| `2025_12_10_000009_create_exam_attempts_table` | `exam_attempts` | Student exam attempts |
| `2025_12_10_000012_create_exam_results_table` | `exam_results` | Exam scores |
| `2025_12_13_000003_create_student_answers_table` | `student_answers` | Individual question answers |

### Attendance and Tracking

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_10_000011_create_attendances_table` | `attendances` | Student attendance records |
| `2025_12_12_000002_create_student_activity_logs_table` | `student_activity_logs` | Activity tracking |
| `2026_01_08_000004_create_teacher_attendance_logs_table` | `teacher_attendance_logs` | Teacher check-in/out |

### Gamification

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_17_000001_create_student_points_table` | `student_points` | Point balances |
| `2025_12_17_000002_create_point_transactions_table` | `point_transactions` | Point history |
| `2025_12_17_000003_create_gamification_settings_table` | `gamification_settings` | Point configuration |
| `2025_12_17_100000_create_student_failed_questions_table` | `student_failed_questions` | Wrong answer tracking |

### Video Feature

| Migration | Table | Description |
|-----------|-------|-------------|
| `2026_03_06_000400_create_videos_feature_tables` | `videos`, `video_group_targets`, `video_attachments`, `video_access_grants` | Video content system |
| `2026_03_07_000001_create_video_upload_sessions_table` | `video_upload_sessions` | Upload tracking |
| `2026_03_09_000001_create_video_quiz_tables` | `video_quizzes`, `video_quiz_questions` | Interactive video quizzes |

### Notifications

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_10_000011_create_notifications_table` | `notifications` | Laravel notifications |
| `2025_12_10_000012_create_sent_notifications_table` | `sent_notifications` | Custom notification tracking |
| `2026_01_08_200044_create_academy_notifications_table` | `academy_notifications` | Academy-wide announcements |
| `2025_12_10_212838_create_device_tokens_table` | `device_tokens` | Push notification tokens |
| `2025_12_31_000001_create_parent_device_tokens_table` | `parent_device_tokens` | Guardian device tokens |

### Subscriptions and Billing

| Migration | Table | Description |
|-----------|-------|-------------|
| `2026_02_13_000001_create_subscriptions_table` | `subscriptions` | Unified subscription tracking |
| `2026_02_22_000001_create_teacher_subscriptions_table` | `teacher_subscriptions` | Teacher-specific subscriptions |
| `2026_02_23_000001_create_academy_subscriptions_table` | `academy_subscriptions` | Academy-specific subscriptions |
| `2025_12_18_000001_create_payment_logs_table` | `payment_logs` | Payment records |
| `2026_01_05_000002_create_daily_voice_limits_table` | `daily_voice_limits` | Voice call quotas |

### Laravel Package Tables

| Migration | Table | Description |
|-----------|-------|-------------|
| `2025_12_10_000013_create_sessions_table` | `sessions` | Session storage |
| `2025_12_10_000014_create_password_reset_tokens_table` | `password_reset_tokens` | Password resets |
| `2025_12_10_000015_create_cache_table` | `cache` | Cache storage |
| `2025_12_10_000016_create_jobs_table` | `jobs` | Queue jobs |
| `2025_12_10_000017_create_personal_access_tokens_table` | `personal_access_tokens` | API tokens |
| `2025_12_10_000018_create_permission_tables` | `permissions`, `roles`, etc. | Spatie permissions |
| `2025_12_10_121147_create_telescope_entries_table` | `telescope_entries` | Debug assistant |
| `2026_03_03_001901_create_media_table` | `media` | Spatie media library |
| `2026_03_03_001902_create_activity_log_table` | `activity_log` | Spatie activity log |
| `2026_03_03_001936_create_health_tables` | Health tables | Server health monitoring |

### Schema Modifications

| Migration | Description |
|-----------|-------------|
| `2025_12_22_133813_make_payment_log_columns_nullable` | Make payment log columns nullable |
| `2025_12_29_000001_create_login_attempts_table` | Login attempt tracking |
| `2025_12_16_092526_create_settings_table` | Platform settings |
| `2026_01_05_000001_add_voice_columns_to_sent_notifications` | Voice message support |
| `2026_02_07_000001_add_performance_indexes` | Core performance indexes |
| `2026_02_13_000002_add_subscription_fields_to_teachers` | Subscription fields for teachers |
| `2026_02_23_131335_add_subscription_fields_to_academies_table` | Subscription fields for academies |
| `2026_03_03_000001_add_subscription_period_to_teachers_and_academies` | Subscription period fields |
| `2026_03_06_000100_add_trial_period_days_to_teachers_and_academies` | Trial period fields |
| `2026_03_06_000300_add_recipient_meta_to_academy_notifications` | Notification recipient metadata |
| `2026_03_09_000002_add_video_points_to_gamification_settings` | Video-related gamification |
| `2026_03_09_000003_add_storage_quota_to_teachers_and_academies` | Video storage quotas |
| `2026_03_09_000004_add_discount_amount_to_teachers_and_academies` | Discount amount fields |
| `2026_03_11_000001_add_unique_constraint_to_point_transactions` | Unique constraint on transactions |
| `2026_03_23_000001_add_missing_performance_indexes` | Additional performance indexes |

## Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Fresh migration (drop all tables and re-run)
php artisan migrate:fresh

# Fresh migration with seeding
php artisan migrate:fresh --seed

# Rollback the last batch of migrations
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Check migration status
php artisan migrate:status

# Inside Docker container
docker compose exec octane php artisan migrate
docker compose exec octane php artisan migrate:fresh --seed
```

## Creating New Migrations

```bash
# Create a migration for a new table
php artisan make:migration create_examples_table

# Create with a model and migration together
php artisan make:model Example -m

# Add columns to an existing table
php artisan make:migration add_status_to_examples_table

# Create in a specific path
php artisan make:migration create_examples_table --path=database/migrations/custom
```

## Common Patterns

### UUID Primary Keys

All tables use UUID primary keys instead of auto-incrementing integers:

```php
$table->uuid('id')->primary();
```

### Foreign Keys

```php
// Required foreign key with cascade delete
$table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');

// Nullable foreign key with null on delete
$table->foreignUuid('academy_id')->nullable()->constrained()->nullOnDelete();

// Simple foreign key (index only, no constraint)
$table->uuid('grade_id');
$table->foreign('grade_id')->references('id')->on('grades');
```

### Indexes

```php
// Single column index
$table->index('phone');

// Named composite index
$table->index(['teacher_id', 'is_active'], 'teacher_active_index');

// Unique composite index
$table->unique(['student_id', 'teacher_id', 'academy_id'], 'enrollment_context_unique');
```

### Soft Deletes

```php
// Enable soft deletes for recoverable data
$table->softDeletes();
```

### Enum Columns

```php
// Using enum values with defaults
$table->string('status')->default(\App\Domains\Auth\Enums\TeacherStatus::PENDING->value);
```

### JSON Columns

```php
// JSON data storage
$table->json('recurrence_days')->nullable();
$table->json('options')->nullable();
```

## Migration Structure

Each migration follows the standard Laravel anonymous class structure:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('table_name', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // ... columns
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['column1', 'column2']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_name');
    }
};
```

## Performance Indexes

Dedicated migration files manage performance indexes separately from table creation:

| Migration | Description |
|-----------|-------------|
| `2026_02_07_000001_add_performance_indexes` | Core performance indexes |
| `2026_03_23_000001_add_missing_performance_indexes` | Additional indexes from SQL review |

### Key Index Categories

#### Students Table

```php
$table->index('created_at', 'students_created_at_index');
$table->index('name', 'students_name_index');
$table->index('phone');
$table->index('guardian_id');
```

#### Lectures Table

```php
$table->index(['teacher_id', 'is_active'], 'lectures_teacher_active_index');
$table->index(['grade_id', 'is_active'], 'lectures_grade_active_index');
$table->index(['teacher_id', 'start_time', 'is_active'], 'idx_lectures_teacher_date');
$table->index(['academy_id', 'start_time'], 'lectures_academy_start_time_index');
```

#### Enrollments Table

```php
$table->index('student_id');
$table->index('teacher_id');
$table->index('academy_id');
$table->index(['teacher_id', 'is_active'], 'enrollments_teacher_active_index');
$table->index(['grade_id', 'is_active'], 'enrollments_grade_active_index');
$table->index(['teacher_id', 'grade_id', 'is_active'], 'idx_enrollments_lookup');
$table->index(['student_id', 'is_active'], 'enrollments_student_active_index');
```

#### Attendances Table

```php
$table->index(['lecture_id', 'created_at'], 'attendances_lecture_date_index');
$table->index(['student_id', 'created_at'], 'attendances_student_date_index');
$table->index(['lecture_id', 'status'], 'idx_attendance_lecture');
$table->index(['student_id', 'lecture_id'], 'idx_attendance_student');
```

## Best Practices

1. **Always use UUID primary keys** -- all entities use `$table->uuid('id')->primary()`
2. **Define foreign key constraints** -- use `constrained()` with appropriate `onDelete` behavior
3. **Add indexes for foreign keys** -- all foreign key columns should be indexed
4. **Use named indexes** -- give composite indexes descriptive names for easier management
5. **Keep migrations reversible** -- always implement a proper `down()` method
6. **Use soft deletes for recoverable data** -- `$table->softDeletes()` on critical entities
7. **Separate index migrations** -- create dedicated migration files for performance indexes

## References

- [Database Overview](/backend/database/) - Entity relationships and schema overview
- [Database Seeders](/backend/database/seeders) - Data population
- [Database Factories](/backend/database/factories) - Test data generation
