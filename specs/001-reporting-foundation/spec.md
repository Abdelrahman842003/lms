# Spec 001: Reporting Foundation

## Goal
Build the shared reporting foundation for the LMS reporting system so that Admin, Academy, and Teacher reports use one consistent data model, time filtering strategy, KPI format, trend calculation logic, and drill-down behavior.

## Background
The platform is a multi-tenant LMS where academies and independent teachers subscribe based on the number of linked students rather than platform commission. [cite:13]
Because of that, reports must focus on student-linked growth, activity, attendance, subscription usage, and time-based business performance instead of static per-student pricing. [cite:13]

## Problem
The reporting domain should not produce three unrelated dashboards.
All report types need a shared reporting language:
- same date filters
- same comparison periods
- same trend indicators
- same status labels
- same rules for active vs inactive students
- same card hierarchy and drill-down behavior

Without a shared foundation, Admin, Academy, and Teacher reports will drift in naming, logic, and user experience.

## Objectives
- Define one shared reporting period model.
- Define one shared KPI format.
- Define one shared trend model.
- Define one shared alert model.
- Define one shared drill-down behavior.
- Define which metrics are snapshot-only, trendable, or both.

## In Scope
- Global date filters
- KPI card format
- Comparison logic
- Growth/trend labels
- Alert and warning rules
- Shared report sections ordering
- Shared empty, loading, and error states
- Shared export structure

## Out of Scope
- UI visual polish beyond reporting structure
- Advanced forecasting
- Machine learning recommendations
- Financial accounting beyond LMS operational reporting

## Shared Filters
Every report must support:
- Today
- Last 7 days
- This month
- Last month
- Last 3 months
- This year
- Custom range

Every report must also support comparison modes:
- vs previous period
- vs same period last year where applicable

## Shared KPI Rules
Each KPI card must contain:
- metric title
- current value
- previous value or comparison baseline
- change percentage
- direction: up / down / stable
- optional status color
- optional short note

Examples:
- Total Students
- Active Students
- Attendance Rate
- Monthly Revenue
- Subscription Usage
- New Linked Students

## Shared Trend Logic
Trend widgets must answer:
- what is the current value
- what was the previous value
- what is the percentage change
- is the metric improving or declining

Every trendable metric must support:
- current period
- previous period
- percentage difference
- sparkline or monthly sequence

## Shared Definitions
Define these terms globally:

### Active student
Student with an enrollment record where `enrollments.is_active = true` and `enrollments.deleted_at IS NULL` for the scoped entity (teacher or academy). Counted as `COUNT(DISTINCT student_id)` on active, non-soft-deleted enrollments.

The enrollment model uses Laravel's `SoftDeletes` trait. Queries must exclude soft-deleted enrollments (`whereNull('deleted_at')`) — Laravel's Eloquent handles this automatically when using the model, but raw query builders must filter explicitly.

Activity is determined by enrollment status flag, not by behavioral tracking within a time window. The `EnrollmentStatusService` may compute runtime statuses (active, trial, grace_period, expired) based on `subscription_start`/`subscription_end` dates, but for reporting purposes, `is_active = true` is the single source of truth.

### Inactive student
Student linked to the entity via enrollment but with `enrollments.is_active = false` and `enrollments.deleted_at IS NULL`. Calculated as total linked students minus active students.

### Attendance rate
Attended sessions divided by eligible sessions.

**Numerator**: `COUNT(attendances WHERE status IN ('present', 'late'))`

**Denominator**: `COUNT(lecture_sessions WHERE is_cancelled = false AND session date falls within selected period AND student has an active enrollment at session time)`

**"Student enrolled at session time"** means:
- An enrollment record exists for that student scoped to the session's teacher/group
- `enrollments.is_active = true` at the time of the session
- `enrollments.subscription_start <= session_date` (if subscription_start is not null)
- `enrollments.subscription_end >= session_date` (if subscription_end is not null)
- `enrollments.deleted_at IS NULL`

**Edge cases**:
- Mid-period enrollments: students enrolled partway through a period are only counted in the denominator for sessions occurring after their enrollment start date
- Soft-deleted enrollments: excluded from both numerator and denominator entirely
- Cancelled sessions: excluded from denominator (student was not expected to attend)
- Attendance records for students not enrolled at session time: excluded from numerator (data integrity safeguard — the system currently does not validate enrollment at attendance time, so this filter is the reporting layer's responsibility)

### Revenue
Sum of `payment_logs.amount` for payments with `status = 'confirmed'` and `confirmed_at` falling within the selected period.

**Clarifications**:
- `payment_logs.amount` stores the **net amount after discount** (base_price * months - discount_amount). It is the teacher-receivable amount.
- `payment_logs.base_price` stores the pre-discount price if the original price is needed.
- `payment_logs.commission` is currently always 0 (no platform commission model). If this changes, revenue should remain based on `amount` (teacher income), not `amount + commission` (platform income).
- No refund system exists. Once a payment is `confirmed`, there is no reversal, credit, or partial refund mechanism. If a refund system is added later, confirmed revenue must be adjusted by subtracting refunded amounts where `refund_status = 'processed'`.
- Excluded statuses: `pending` (not yet realized), `expired` (payment window lapsed), `cancelled` (explicitly voided).

### Subscription usage
Used student slots divided by plan limit.

**Formula**: `COUNT(DISTINCT student_id FROM enrollments WHERE is_active = true AND deleted_at IS NULL) / plan_max_students * 100`

**For capped plans** (`is_unlimited_students = false`): Reports usage percentage. Alert triggers at 80% (warning) and 95% (critical).

**For unlimited plans** (`is_unlimited_students = true`): Usage percentage is not applicable. Reports raw active student count instead of a percentage. No limit-based alerts trigger. Display label: "Unlimited — {count} students" rather than a percentage bar.

**Edge cases**:
- `plan_max_students = 0` or `NULL` with `is_unlimited_students = false`: treated as a data error. Report shows 0% with a note "Plan limit not configured".
- Soft-deleted enrollments are excluded from the used count.

### Growth
Percentage change between current period value and previous matching period value.

**Formula**: `((current - previous) / ABS(previous)) * 100` when `previous != 0`

**When previous = 0**:
- If `current > 0`: direction = "up", percentage = null, display label = "New — no prior data"
- If `current = 0`: direction = "stable", percentage = 0, display label = "No change"
- If `current < 0`: direction = "down", percentage = null, display label = "New — no prior data" (edge case for negative metrics)

**Display convention**: When percentage is null (no prior data), the KPI card shows the direction arrow and the "New — no prior data" label in place of the percentage. This avoids showing "∞%" or misleading numbers.

**"Previous matching period"** means:
- For preset periods (this month, last month, etc.): the immediately preceding period of equal length
- For custom ranges: the equal-length period immediately before the selected start date
- Year-over-year comparison: the same calendar period in the previous year

## Shared Report Layout
Every report page should follow this order:
1. Header and filters
2. Top KPI cards
3. Trend section
4. Breakdown section
5. Detailed table/list section
6. Alerts and action-needed section

## Shared Alerts
All reports should support warning states with the following global default thresholds.

**These thresholds are global platform defaults, currently hardcoded in alert rule classes. They are NOT per-tenant or per-academy configurable.** Making them tenant-configurable would require: (1) a database table for threshold overrides, (2) constructor injection in alert rules, and (3) a threshold resolution service. This is explicitly out of scope for the initial implementation.

### Shared alert catalog

| Alert | Trigger | Severity |
|---|---|---|
| Revenue/Income drop | ≥20% decrease vs previous period | Critical |
| Revenue/Income drop | ≥10% decrease vs previous period | Warning |
| Attendance drop | ≥20% decrease vs previous period | Critical |
| Attendance drop | ≥10% decrease vs previous period | Warning |
| High inactivity | ≥50% of linked students inactive | Warning |
| Usage near plan limit | ≥90% of plan capacity used | Critical |
| Usage near plan limit | ≥75% of plan capacity used | Warning |
| Renewal approaching | ≤3 days until renewal | Critical |
| Renewal approaching | ≤7 days until renewal | Warning |
| Renewal approaching | ≤14 days until renewal | Info |
| Strong growth | ≥25% increase vs previous period | Info |

### Alert severity levels
- **Critical**: immediate action required — displayed prominently, surfaced first
- **Warning**: attention needed — displayed in alert panel, ordered after critical
- **Info**: noteworthy but not urgent — displayed in alert panel, ordered last

### Role-specific alerts
Role-specific specs may define additional alert types (e.g., teacher income concentration, session cancellation rate). They must NOT redefine the thresholds or trigger logic for shared alerts listed above. They may only introduce new alert types with their own thresholds.

## Drill-down Rules
Every top-level metric must lead to a deeper breakdown.
Examples:
- Total students → by academy / teacher / group
- Attendance rate → by teacher / course / group
- Revenue → by month / source / teacher / academy
- Subscription usage → by entity and plan

## Export Requirements
Each report should support export of:
- summary KPIs
- filtered breakdown data
- detailed rows
- applied filter metadata

## Acceptance Criteria
- All report roles use the same filter vocabulary.
- All trendable metrics use the same comparison logic.
- All KPI cards follow the same structure.
- Alerts are standardized across reports.
- Drill-down behavior is predictable and role-appropriate.
- Exported reports preserve the same filter context used on screen.
