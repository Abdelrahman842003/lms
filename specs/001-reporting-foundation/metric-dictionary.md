# Metric Dictionary

Centralized mapping of every reporting metric to its exact formula, data source, unit, applicable roles, and edge cases.

## Student Metrics

### Total Linked Students
- **Definition**: Count of distinct students linked to the scoped entity via enrollments
- **Formula**: `COUNT(DISTINCT enrollments.student_id) WHERE entity_scope AND deleted_at IS NULL`
- **Data source**: `enrollments.student_id`, filtered by `teacher_id` or `academy_id`
- **Unit**: integer (count of students)
- **Scope**: Teacher (own students), Academy (academy students), Admin (all students)
- **Edge cases**: Soft-deleted enrollments excluded. Students enrolled with multiple teachers counted once per entity scope, not deduplicated across entities.

### Active Students
- **Definition**: Count of distinct students with active, non-soft-deleted enrollments
- **Formula**: `COUNT(DISTINCT enrollments.student_id) WHERE is_active = true AND deleted_at IS NULL AND entity_scope`
- **Data source**: `enrollments.student_id`, filtered by `is_active = true`, `deleted_at IS NULL`, `teacher_id` or `academy_id`
- **Unit**: integer (count of students)
- **Scope**: All roles
- **Edge cases**: Same student enrolled in multiple groups under same teacher = counted once. Soft-deleted enrollments excluded.

### Inactive Students
- **Definition**: Linked students minus active students
- **Formula**: `total_linked_students - active_students`
- **Data source**: Derived from the two counts above
- **Unit**: integer (count of students)
- **Scope**: All roles
- **Edge cases**: Can be negative if data inconsistency exists (more active than total) — clamp to 0.

### New Students This Month
- **Definition**: Students whose enrollment was created within the current calendar month
- **Formula**: `COUNT(DISTINCT enrollments.student_id) WHERE created_at >= month_start AND created_at <= month_end AND entity_scope`
- **Data source**: `enrollments.student_id`, `enrollments.created_at`
- **Unit**: integer (count of students)
- **Scope**: Academy, Teacher

---

## Attendance Metrics

### Attendance Rate
- **Definition**: Percentage of attended eligible sessions
- **Formula**: `COUNT(attendances WHERE status IN ('present', 'late') AND enrollment_valid_at_session_time) / COUNT(lecture_sessions WHERE is_cancelled = false AND student_enrolled_at_session_time) * 100`
- **Data source**: `attendances.status`, `lecture_sessions.is_cancelled`, `lecture_sessions.date`, `enrollments.is_active`, `enrollments.subscription_start`, `enrollments.subscription_end`, `enrollments.deleted_at`
- **Unit**: percentage (0-100, rounded to 1 decimal)
- **Scope**: Academy (by teacher/group), Teacher (by group/session)
- **Enrollment validity at session time**: `is_active = true` AND `deleted_at IS NULL` AND (`subscription_start IS NULL OR subscription_start <= session_date`) AND (`subscription_end IS NULL OR subscription_end >= session_date`)
- **Edge cases**:
  - No eligible sessions → rate = null (display "N/A — no sessions")
  - Mid-period enrollments: only sessions after enrollment start counted in denominator
  - Cancelled sessions: excluded from denominator
  - No refund/reversal for attendance
- **Breakdown dimensions**: by teacher, by group, by session series

---

## Financial Metrics

### Revenue (Admin)
- **Definition**: Total realized platform income from confirmed payments
- **Formula**: `SUM(payment_logs.amount) WHERE status = 'confirmed' AND confirmed_at BETWEEN period_start AND period_end`
- **Data source**: `payment_logs.amount`, `payment_logs.status`, `payment_logs.confirmed_at`
- **Unit**: decimal (currency, 2 decimal places)
- **Scope**: Admin only (platform-wide)
- **Note**: `amount` is net after discount. `base_price` is pre-discount. `commission` is always 0.

### Income (Teacher)
- **Definition**: Total realized income for a specific teacher from confirmed payments
- **Formula**: `SUM(payment_logs.amount) WHERE status = 'confirmed' AND teacher_id = ? AND confirmed_at BETWEEN period_start AND period_end`
- **Data source**: `payment_logs.amount`, `payment_logs.status`, `payment_logs.teacher_id`, `payment_logs.confirmed_at`
- **Unit**: decimal (currency, 2 decimal places)
- **Scope**: Teacher only (personal income)
- **Note**: Same as Revenue but scoped to a single teacher

### Year-to-Date Income/Revenue
- **Definition**: Cumulative confirmed income from January 1 of the current year to the end of the selected period
- **Formula**: `SUM(payment_logs.amount) WHERE status = 'confirmed' AND confirmed_at >= year_start AND confirmed_at <= period_end`
- **Data source**: Same as Revenue/Income
- **Unit**: decimal (currency, 2 decimal places)
- **Scope**: Admin, Teacher

### Monthly Income/Revenue Trend
- **Definition**: Array of monthly income values for the last 12 months
- **Formula**: For each month in range: `SUM(payment_logs.amount) WHERE status = 'confirmed' AND confirmed_at BETWEEN month_start AND month_end`
- **Data source**: Same as Revenue/Income
- **Unit**: array of `{ month: YYYY-MM, amount: decimal, previous_amount: decimal, change_pct: decimal|null, direction: 'up'|'down'|'stable' }`
- **Scope**: Admin, Teacher

---

## Subscription Metrics

### Subscription Usage Percentage
- **Definition**: Ratio of active student slots to plan capacity
- **Formula**: `COUNT(DISTINCT enrollments.student_id WHERE is_active = true AND deleted_at IS NULL AND entity_scope) / plan_max_students * 100`
- **Data source**: `enrollments.student_id`, `enrollments.is_active`, `teachers.plan_max_students` or `academies.plan_max_students`
- **Unit**: percentage (0-100, rounded to 1 decimal)
- **Scope**: Academy, Teacher, Admin (per entity)
- **Unlimited plans**: Report `0.0` with label "Unlimited — {count} students". No usage alert triggered.
- **Edge cases**: `plan_max_students = 0` or `NULL` with `is_unlimited_students = false` → data error, display "Plan limit not configured"

### Used Student Slots
- **Definition**: Count of distinct active students used for subscription capacity
- **Formula**: `COUNT(DISTINCT enrollments.student_id WHERE is_active = true AND deleted_at IS NULL AND entity_scope)`
- **Data source**: `enrollments.student_id`, `enrollments.is_active`
- **Unit**: integer
- **Scope**: Academy, Teacher

### Remaining Capacity
- **Definition**: Plan limit minus used slots
- **Formula**: `plan_max_students - used_student_slots`
- **Data source**: Derived from plan limit and used slots
- **Unit**: integer
- **Scope**: Academy, Teacher
- **Edge cases**: Can be negative (over-capacity). Display as 0 with warning "Over plan limit".

### Active Subscriptions Count (Admin)
- **Definition**: Count of entities with active subscription status
- **Formula**: `COUNT(subscriptions WHERE status IN ('ACTIVE', 'PAID', 'PARTIAL'))`
- **Data source**: `subscriptions.status`
- **Unit**: integer
- **Scope**: Admin only

### Expired Subscriptions Count (Admin)
- **Definition**: Count of entities with expired subscription status
- **Formula**: `COUNT(subscriptions WHERE status = 'EXPIRED')`
- **Data source**: `subscriptions.status`
- **Unit**: integer
- **Scope**: Admin only

---

## Session Metrics

### Sessions Scheduled
- **Definition**: Count of lecture sessions created within the period
- **Formula**: `COUNT(lecture_sessions WHERE date BETWEEN period_start AND period_end AND entity_scope)`
- **Data source**: `lecture_sessions.date`, `lecture_sessions.lecture_id` (join to lectures for teacher/academy scope)
- **Unit**: integer
- **Scope**: Academy

### Sessions Delivered
- **Definition**: Count of lecture sessions that were not cancelled
- **Formula**: `COUNT(lecture_sessions WHERE date BETWEEN period_start AND period_end AND is_cancelled = false AND entity_scope)`
- **Data source**: `lecture_sessions.is_cancelled`
- **Unit**: integer
- **Scope**: Academy, Teacher (in group breakdown)

### Sessions Cancelled
- **Definition**: Count of cancelled lecture sessions
- **Formula**: `COUNT(lecture_sessions WHERE is_cancelled = true AND date BETWEEN period_start AND period_end AND entity_scope)`
- **Data source**: `lecture_sessions.is_cancelled`
- **Unit**: integer
- **Scope**: Academy

---

## Growth Metrics

### Growth Percentage
- **Definition**: Percentage change between current and previous period
- **Formula**: `((current - previous) / ABS(previous)) * 100` when previous != 0
- **Unit**: percentage (rounded to 1 decimal, can be negative)
- **Scope**: All roles, applied to any trendable metric
- **Edge cases**:
  - `previous = 0, current > 0` → direction = "up", percentage = null, label = "New — no prior data"
  - `previous = 0, current = 0` → direction = "stable", percentage = 0, label = "No change"
  - `previous = 0, current < 0` → direction = "down", percentage = null, label = "New — no prior data"

### Direction
- **Definition**: Whether a metric is improving or declining
- **Values**: `up` (positive change), `down` (negative change), `stable` (change < 0.5% in either direction)
- **Note**: "Up" is not always good — e.g., attendance drop direction is "down" which is bad. Context matters per metric.

---

## Plan Metrics (Admin Only)

### Plan Revenue
- **Definition**: Total confirmed revenue attributed to a specific plan type
- **Formula**: Sum of teacher/academy income filtered by `plan_type`
- **Data source**: `payment_logs.amount` joined with `teachers.plan_type` or `academies.plan_type`
- **Unit**: decimal (currency)
- **Scope**: Admin only

### Plan Average Usage
- **Definition**: Average subscription usage percentage across all entities on a given plan
- **Formula**: `AVG(usage_percentage) WHERE plan_type = ? AND is_unlimited_students = false`
- **Data source**: Derived from subscription usage per entity
- **Unit**: percentage (0-100, rounded to 1 decimal)
- **Scope**: Admin only
