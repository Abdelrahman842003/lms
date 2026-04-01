---
title: Reports & Analytics
description: Comprehensive documentation for the reporting system covering teacher and academy dashboards, KPI cards, drilldown tables, chart components, filtering, and validation schemas.
outline: [2, 3]
---

# Reports & Analytics

The reporting system provides two independent analytics dashboards: one for **teachers** (and secretaries) and one for **academies**. Each dashboard fetches data from dedicated service modules, validates responses through Zod schemas, and renders a collection of shared and role-specific components built with Recharts.

## Overview

| Concern | Teacher Reports | Academy Reports |
|---|---|---|
| Route | `/teacher/reports` | `/academy/reports` |
| Page component | `frontend/src/app/teacher/reports/page.tsx` | `frontend/src/app/academy/reports/page.tsx` |
| Service | `services/teacherReportService.ts` | `services/academyReportService.ts` |
| Types | `types/teacher-report.types.ts` | `types/academyReport.types.ts` |
| Zod schemas | `schemas/teacher-report.schema.ts` | `schemas/report.schema.ts` |
| Access | `teacher`, `secretary` | `academy` |
| Layout | Single-page, all sections stacked | Tab-based, one section at a time |

## Teacher Reports

The teacher reports page renders all report sections in a single scrollable view. Sections appear only when their data is available, and the entire page shows skeleton placeholders during loading.

### Service Layer

**File:** `frontend/src/services/teacherReportService.ts`

The service exposes two functions:

#### `fetchTeacherReportOverview`

Fetches the complete report payload including KPIs, sections, and alerts.

```
GET /teacher/reports/overview?preset=this_month&comparison_mode=previous_period&...
```

**Parameters** (`TeacherReportFilters`):

| Field | Type | Description |
|---|---|---|
| `preset` | `PeriodPreset` | Time period preset. One of `today`, `last_7_days`, `this_month`, `last_month`, `last_3_months`, `this_year`, `custom` |
| `start_at` | `string` | Start date for custom preset (YYYY-MM-DD) |
| `end_at` | `string` | End date for custom preset (YYYY-MM-DD) |
| `comparison_mode` | `ComparisonMode` | `previous_period` or `same_period_last_year` |
| `group_id` | `string` | Filter to a specific group |
| `student_activity_state` | `'active' \| 'inactive'` | Filter students by activity status |
| `attendance_state` | `'good' \| 'poor'` | Filter by attendance quality |

Returns `TeacherReportOverview`.

#### `fetchTeacherDrilldown`

Fetches detailed tabular data for a specific drilldown key (linked from KPI cards or alerts). Supports server-side pagination.

```
GET /teacher/reports/drilldown/{drilldownKey}?page=1&per_page=15
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `drilldownKey` | `string` | required | Identifier returned by a KPI or alert |
| `page` | `number` | `1` | Current page number |
| `perPage` | `number` | `15` | Rows per page |

Returns `TeacherDrilldownResponse`.

### Response Structure

#### `TeacherReportOverview`

```
TeacherReportOverview
├── meta
│   ├── generated_at: string        // ISO timestamp
│   ├── timezone: string            // e.g. "Africa/Cairo"
│   ├── report_scope: string        // e.g. "teacher"
│   └── version: string             // schema version
├── applied_filters
│   ├── preset: string | null
│   ├── start_at: string
│   ├── end_at: string
│   ├── comparison_mode: string | null
│   └── timezone: string
├── summary: TeacherReportKpi[]     // Array of KPI cards
├── sections: TeacherReportSections
│   ├── income_trends?              // Income summary + chart series
│   ├── monthly_income?             // Month-by-month income table
│   ├── student_activity?           // Activity metrics + student list
│   ├── attendance?                 // Attendance rates by group
│   ├── group_breakdown?            // Per-group performance table
│   └── subscription?               // Plan usage and capacity
└── alerts: TeacherAlert[]
```

#### `TeacherDrilldownResponse`

```
TeacherDrilldownResponse
├── drilldown_key: string
├── title: string
├── schema
│   └── columns: { key: string; label: string; sortable?: boolean }[]
├── rows: Record<string, unknown>[]
└── pagination
    ├── current_page: number
    ├── per_page: number
    └── total: number
```

The `schema.columns` array is sent by the server, allowing the `DrilldownTable` component to render dynamic columns without hardcoding any field names.

### Teacher Report Sections

#### Income Trends

Rendered by `IncomeTrends` component. Displays:

- **Summary cards**: current income, baseline period income, and percentage change with directional indicators.
- **Line chart** (`recharts` `LineChart`): plots `IncomeTrendSeries` data points with labels on the X axis and values on the Y axis.

Data shape:

```ts
interface IncomeTrendSummary {
  current: number;
  baseline: number | null;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
}

interface IncomeTrendSeries {
  label: string;
  value: number;
}
```

#### Monthly Income Table

Rendered by `MonthlyIncomeTable`. A tabular breakdown of income per month with columns for month name, amount, previous period amount, change percentage, and trend direction.

```ts
interface MonthlyIncomeRow {
  month: string;
  month_name: string;
  amount: number;
  previous_amount: number | null;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
}
```

#### Student Activity

Two components handle this section:

- **`StudentActivity`** -- Displays four metric cards (total, active, inactive, new students) and an area chart showing the activity trend over time.
- **`StudentActivityTable`** -- A table listing individual students with their name, group, activity state badge, and last activity date.

```ts
interface StudentActivityMetrics {
  total_students: number;
  active_students: number;
  inactive_students: number;
  new_students: number;
  activity_trend: IncomeTrendSeries[];
}

interface StudentActivityTableRow {
  student_name: string;
  group_name: string;
  activity_state: string;
  last_activity_date: string | null;
}
```

#### Attendance Performance

Two components:

- **`AttendancePerformance`** -- Shows overall attendance rate with direction, best and worst groups, change from previous period, and a bar chart of attendance rates by group.
- **`AttendanceDetailTable`** -- A detailed table with per-group metrics: student count, attendance rate (color-coded by threshold: green >= 80%, yellow >= 60%, red < 60%), session count, and trend.

```ts
interface AttendancePerformance {
  overall_rate: number;
  overall_direction: 'up' | 'down' | 'stable';
  by_group: AttendanceGroupMetrics[];
  best_group: string;
  worst_group: string;
  change_from_previous: number | null;
}

interface AttendanceGroupMetrics {
  group_name: string;
  students_count: number;
  attendance_rate: number;
  sessions_count: number;
  trend: 'up' | 'down' | 'stable';
}
```

#### Group Breakdown

Rendered by `GroupBreakdown`. A comprehensive table of all groups with student counts, active student counts, attendance rate, delivered sessions, income contribution, and trend direction.

```ts
interface GroupBreakdownRow {
  group_name: string;
  students_count: number;
  active_students: number;
  attendance_rate: number;
  delivered_sessions: number;
  income_contribution: number;
  trend: 'up' | 'down' | 'stable';
}
```

#### Subscription Capacity

Rendered by `SubscriptionCapacity`. Shows the current plan, usage progress bar (color changes: green < 70%, yellow 70-90%, red > 90%), remaining seats, and renewal date with a countdown.

```ts
interface SubscriptionCapacity {
  plan_name: string;
  student_limit: number | null;
  used_slots: number;
  remaining_capacity: number;
  usage_percentage: number;
  renewal_date: string | null;
  status: string;
}
```

#### Alerts and Recommendations

Rendered by `AlertsRecommendations`. Sorted by severity (critical first, then warning, then info). Each alert shows a colored severity badge, message text, and optionally a drilldown link.

```ts
interface TeacherAlert {
  alert_key: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  context?: Record<string, unknown>;
  source_section?: string;
  drilldown_key?: string;
}
```

### Teacher Page Data Flow

The page component (`frontend/src/app/teacher/reports/page.tsx`) manages the following state:

1. `filters` (`TeacherReportFilters`) -- controlled by the `ReportFilters` component.
2. `report` (`TeacherReportOverview | null`) -- populated by `fetchTeacherReportOverview`.
3. `drilldown` (`TeacherDrilldownResponse | null`) -- populated by `fetchTeacherDrilldown` when a user clicks a KPI or alert with a `drilldown_key`.

On mount (after auth check), the report loads once. The user can modify filters and click "update report" to reload. Skeleton placeholders (`KpiGridSkeleton`, `ChartSkeleton`, `TableSkeleton`) are shown during loading. When a drilldown is active, the `DrilldownTable` overlay appears below the main report with paginated navigation.

## Academy Reports

The academy reports page uses a **tab-based** layout. Only the active tab's data is fetched, reducing initial payload size. Each tab maps to a separate API endpoint and a dedicated component.

### Service Layer

**File:** `frontend/src/services/academyReportService.ts`

The service uses `axios` with auth headers and a versioned API base URL.

#### `getAcademyReportOverview`

```
GET /academy/reports/overview
```

Returns a combined `AcademyReportOverview` with snapshot, alert summary, and highlight KPIs. Used for high-level dashboard views.

#### `getAcademySnapshot`

```
GET /academy/reports/snapshot
```

Returns `AcademySnapshot` with KPI cards and period info.

#### `getStudentDistribution`

```
GET /academy/reports/student-distribution
```

Returns `StudentDistribution` with breakdowns by grade, group, teacher, and active/inactive counts plus a time series of new student enrollments.

#### `getTeacherPerformance`

```
GET /academy/reports/teacher-performance?page=1&per_page=15&sort_column=linked_students&sort_direction=desc
```

Returns `TeacherPerformanceResponse` (a `BreakdownData<TeacherPerformanceRow>`) with server-side pagination and sorting.

| Parameter | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `per_page` | `15` | Rows per page |
| `sort_column` | `linked_students` | Column to sort by |
| `sort_direction` | `desc` | `asc` or `desc` |

#### `getAttendanceQuality`

```
GET /academy/reports/attendance-quality
```

Returns `AttendanceQuality` with overall rate, per-teacher and per-group breakdowns, trend time series, and ranked best/weakest groups.

#### `getSessionExecution`

```
GET /academy/reports/session-execution?page=1&per_page=15
```

Returns `SessionExecution` with a summary object (scheduled, delivered, canceled, postponed counts and average attendance) plus a paginated `BreakdownData<SessionRow>`.

#### `getSubscriptionUsage`

```
GET /academy/reports/subscription-usage
```

Returns `SubscriptionUsage` with plan details, slot usage, and renewal info. Takes no filters.

#### `getTimeComparison`

```
GET /academy/reports/time-comparison
```

Returns `TimeComparison` with current and comparison period metric totals plus an array of `MetricChange` objects showing per-metric direction and percentage change.

#### `getAcademyAlerts`

```
GET /academy/reports/alerts
```

Returns `AcademyAlert[]` with severity-graded alert items.

### Academy Filters

```ts
interface AcademyReportFilters {
  preset?: string;
  start_at?: string;
  end_at?: string;
  comparison_mode?: string;
  teacher_id?: string;
  grade_id?: string;
  group_id?: string;
  student_status?: string;
  session_status?: string;
}
```

### Academy Report Tabs

The academy page defines eight tabs:

| Tab Key | Label | Component | Data Loaded |
|---|---|---|---|
| `snapshot` | Overview | `AcademySnapshot` | `AcademySnapshot` |
| `students` | Student Distribution | `StudentDistributionCharts` | `StudentDistribution` |
| `teachers` | Teacher Performance | `TeacherPerformanceTable` | `TeacherPerformanceResponse` |
| `attendance` | Attendance Quality | `AttendanceQualityPanel` | `AttendanceQuality` |
| `sessions` | Session Execution | `SessionExecutionReport` | `SessionExecution` |
| `subscription` | Subscription | `SubscriptionUsageCard` | `SubscriptionUsage` |
| `comparison` | Time Comparison | `TimeComparisonPanel` | `TimeComparison` |
| `alerts` | Alerts | `AlertsPanel` | `AcademyAlert[]` |

### Academy Response Types

#### `AcademyReportOverview`

```ts
interface AcademyReportOverview {
  snapshot: AcademySnapshot;
  alerts_summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  highlights: KpiCard[];
}
```

#### `AcademySnapshot`

```ts
interface AcademySnapshot {
  kpis: KpiCard[];
  period: {
    start: string;
    end: string;
    preset: string;
  };
}
```

#### `StudentDistribution`

```ts
interface StudentDistribution {
  by_grade: GradeDistribution[];
  by_group: GroupDistribution[];
  by_teacher: TeacherStudentDistribution[];
  active_vs_inactive: { active: number; inactive: number };
  new_students_over_time: TimeSeriesPoint[];
}
```

#### `AttendanceQuality`

```ts
interface AttendanceQuality {
  overall_rate: number;
  by_teacher: TeacherAttendanceRate[];
  by_group: GroupAttendanceRate[];
  trend: TimeSeriesPoint[];
  best_groups: RankedGroup[];
  weakest_groups: RankedGroup[];
}
```

#### `SessionExecution`

```ts
interface SessionExecution {
  summary: SessionExecutionSummary;  // scheduled, delivered, canceled, postponed, avg_attendance
  sessions: BreakdownData<SessionRow>;  // paginated session rows
}
```

#### `SubscriptionUsage`

```ts
interface SubscriptionUsage {
  plan_name: string;
  plan_price: number;
  student_limit: number;
  used_slots: number;
  usage_percentage: number;
  renewal_date: string | null;
  subscription_status: string;
}
```

#### `TimeComparison`

```ts
interface TimeComparison {
  current_period: Record<string, number>;
  comparison_period: Record<string, number>;
  comparison_mode: string;
  changes: MetricChange[];
}
```

#### `AcademyAlert`

```ts
interface AcademyAlert {
  rule: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: Record<string, unknown>;
}
```

#### `BreakdownData<T>`

A generic paginated container used by `TeacherPerformanceResponse` and `SessionExecution.sessions`:

```ts
interface BreakdownData<T = Record<string, unknown>> {
  data: T[];
  schema: Record<string, string>;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  sort: {
    column: string;
    direction: string;
  };
}
```

### Academy Page Data Flow

1. Auth guard ensures `user.userType === 'academy'`.
2. A `Set<string>` (`loadingSections`) tracks which tab is currently loading, enabling per-tab loading spinners.
3. Each tab has a dedicated `load*` callback that sets the loading state, calls the service, and stores the result.
4. When the active tab changes, the corresponding load callback fires via `useEffect`.
5. The filter bar triggers `loadActiveSection()` when the user applies new filters.

## Shared Components

### KpiCard

**File:** `frontend/src/components/reports/KpiCard.tsx`

A reusable card displaying a single KPI metric with:

- Title and numeric value (formatted as percentage when `note === '%'`, otherwise locale-formatted).
- Change percentage with directional arrow and color (green for up, red for down, gray for stable). Direction semantics can be inverted for negative metrics (e.g., "late" or "remaining").
- Baseline value shown as secondary text.
- Status-colored border (`red`, `warning`, `success`).
- Click-to-drilldown support when `drilldownKey` and `onDrilldown` are provided.

Props:

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Metric label |
| `currentValue` | `number` | Current period value |
| `baselineValue` | `number \| null` | Comparison period value |
| `changePct` | `number \| null` | Percentage change |
| `direction` | `'up' \| 'down' \| 'stable'` | Trend direction |
| `statusColor` | `string \| null` | Border color hint |
| `note` | `string \| null` | When `'%'`, renders value as percentage |
| `drilldownKey` | `string \| null` | Links to drilldown data |
| `onDrilldown` | `(key: string) => void` | Click handler |
| `icon` | `string` | Icon name |

### DrilldownTable

**File:** `frontend/src/components/reports/DrilldownTable.tsx`

A generic table that renders columns dynamically based on the server-provided `schema.columns` array. Features:

- Dynamic column headers from `schema.columns[].label`.
- Rows rendered as `Record<string, unknown>`, with each cell converted to string or a dash for null/undefined.
- Pagination controls (previous/next) wired to `onPageChange`.
- Close button wired to `onClose`.
- Empty state with a "no data" message.

Props:

| Prop | Type | Description |
|---|---|---|
| `data` | `TeacherDrilldownResponse` | Full response including schema, rows, and pagination |
| `onPageChange` | `(page: number) => void` | Pagination callback |
| `onClose` | `() => void` | Close handler |

### ReportSkeletons

**File:** `frontend/src/components/reports/teacher/ReportSkeletons.tsx`

Three skeleton components for loading states:

- **`KpiGridSkeleton`** -- 4-card grid with pulse animation.
- **`ChartSkeleton`** -- Summary cards placeholder + chart area placeholder.
- **`TableSkeleton`** -- Header row + 5 body rows with pulse animation.

All skeletons use `animate-pulse` on a dark background (`bg-white/5`, `bg-gray-700`).

### ReportFilters (Teacher)

**File:** `frontend/src/components/reports/teacher/ReportFilters.tsx`

Provides a filter panel with:

- **Period preset** select (today, last 7 days, this month, last month, last 3 months, this year, custom).
- **Student activity state** select (all, active, inactive).
- **Comparison mode** select (none, previous period, same period last year).
- **Custom date range** inputs (conditionally shown when preset is `custom`).
- **Apply button** that triggers `onApply` with loading state.

## Zod Validation Schemas

Two schema files provide runtime validation for report data.

### `schemas/teacher-report.schema.ts`

Validates the teacher-specific report structures. Key schemas:

| Schema | Validates |
|---|---|
| `PeriodPresetSchema` | Enum of period preset values |
| `ComparisonModeSchema` | `previous_period` or `same_period_last_year` |
| `DirectionSchema` | `up`, `down`, `stable` |
| `TeacherReportKpiSchema` | KPI card structure |
| `IncomeTrendSummarySchema` | Income summary with direction |
| `IncomeTrendsSchema` | Summary + series array |
| `MonthlyIncomeRowSchema` | Monthly income table row |
| `StudentActivityMetricsSchema` | Student counts and trend |
| `StudentActivitySchema` | Metrics + student list |
| `AttendancePerformanceSchema` | Attendance rates by group |
| `GroupBreakdownSchema` | Group breakdown rows |
| `SubscriptionCapacitySchema` | Plan usage data |
| `TeacherAlertSchema` | Alert with severity and context |
| `TeacherReportSectionsSchema` | All optional report sections |
| `TeacherReportOverviewSchema` | Full overview response |
| `TeacherDrilldownResponseSchema` | Drilldown with dynamic schema |

### `schemas/report.schema.ts`

Validates general report structures shared across roles. Key schemas:

| Schema | Validates |
|---|---|
| `PeriodPresetSchema` | `last_month`, `last_3_months`, `last_6_months`, `last_year`, `custom` |
| `ReportTypeSchema` | `admin`, `teacher`, `academy` |
| `DateRangeSchema` | Start/end date in `YYYY-MM-DD` format |
| `GenerateReportRequestSchema` | Full report request with refinement logic (teacher requires `teacher_id`, academy requires `academy_id`, custom requires dates) |
| `TeacherReportSummarySchema` | Student counts, payment data, `subscription_fee` as primary metric |
| `AcademyReportSummarySchema` | Teacher/student/enrollment counts, financial data |
| `AdminReportSummarySchema` | Platform-wide totals including commissions and profit |
| `FinancialDetailsSchema` | Revenue, payments, and balance |
| `MonthlyBreakdownItemSchema` | Per-month enrollment and payment counts |
| `SubscriptionBreakdownItemSchema` | Per-month subscription amount tracking with status |
| `TeacherInfoSchema` | Teacher profile with subscription metadata |
| `AcademyInfoSchema` | Academy profile with subscription metadata |

Helper functions exported from this file:

- **`calculateSummaryTotals`** -- Aggregates student counts from multiple summaries.
- **`calculateFinancialTotals`** -- Aggregates financial metrics and averages collection rates.
- **`formatCurrency`** -- Locale-aware currency formatting (Arabic `EGP` or English `EGP`).
- **`formatNumber`** -- Locale-aware number formatting.

## Route Registration

Teacher reports are registered in the sidebar at `/teacher/reports` and are lazy-loaded via `OptimizedComponents`:

```ts
TeacherReports: lazy(() => import('@/app/teacher/reports/page'))
```

Academy reports are accessible from the navbar at `/academy/reports`.

Both pages guard access with `useAuth()` and redirect to `/login` if the user is unauthenticated or lacks the required role.

## Component Directory Structure

```
frontend/src/
├── components/
│   └── reports/
│       ├── KpiCard.tsx                              # Shared KPI display card
│       ├── DrilldownTable.tsx                        # Shared dynamic drilldown table
│       └── teacher/
│           ├── ReportFilters.tsx                     # Filter panel for teacher reports
│           ├── ReportSkeletons.tsx                   # Loading skeletons (KpiGrid, Chart, Table)
│           ├── TeacherSnapshot.tsx                   # KPI grid with icon mapping
│           ├── IncomeTrends.tsx                      # Line chart + summary cards
│           ├── MonthlyIncomeTable.tsx                # Monthly income breakdown table
│           ├── StudentActivity.tsx                   # Metric cards + area chart
│           ├── StudentActivityTable.tsx              # Student list table with status badges
│           ├── AttendancePerformance.tsx             # Bar chart + attendance summary
│           ├── AttendanceDetailTable.tsx             # Per-group attendance detail table
│           ├── GroupBreakdown.tsx                    # Group performance table
│           ├── SubscriptionCapacity.tsx              # Plan usage progress bar
│           └── AlertsRecommendations.tsx             # Severity-sorted alerts panel
├── app/
│   ├── teacher/reports/page.tsx                      # Teacher reports page
│   └── academy/reports/
│       ├── page.tsx                                  # Academy reports page (tab-based)
│       └── components/
│           ├── ReportFiltersBar.tsx
│           ├── AcademySnapshot.tsx
│           ├── StudentDistributionCharts.tsx
│           ├── TeacherPerformanceTable.tsx
│           ├── AttendanceQualityPanel.tsx
│           ├── SessionExecutionReport.tsx
│           ├── SubscriptionUsageCard.tsx
│           ├── TimeComparisonPanel.tsx
│           └── AlertsPanel.tsx
├── services/
│   ├── teacherReportService.ts
│   └── academyReportService.ts
├── types/
│   ├── teacher-report.types.ts
│   └── academyReport.types.ts
└── schemas/
    ├── teacher-report.schema.ts
    └── report.schema.ts
```

## Chart Library

All charts use **Recharts** (`recharts`). The following chart types are used across the reporting system:

| Component | Chart Type | Recharts Components |
|---|---|---|
| `IncomeTrends` | Line chart | `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` |
| `StudentActivity` | Area chart | `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` |
| `AttendancePerformance` | Bar chart | `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer` |

All charts are wrapped in `ResponsiveContainer` for responsive sizing and use `dir="ltr"` to ensure correct axis rendering in the RTL layout. Tooltip styling uses a dark theme (`backgroundColor: '#1f2937'`) with white text.

## Direction and Color Conventions

### Direction Indicators

The `direction` field (`'up' | 'down' | 'stable'`) is used consistently across KPIs, trends, and table rows:

- `up` -- green arrow up (positive change)
- `down` -- red arrow down (negative change)
- `stable` -- gray arrow right (no significant change)

Some metrics invert the color logic (e.g., "remaining" or "late" counts) where a decrease is positive.

### Status Colors

- **KPI border**: `red` (border-red-500/40), `warning` (border-yellow-500/40), `success` (border-green-500/40)
- **Alert severity**: critical (red), warning (yellow), info (blue) with matching background, border, and badge colors
- **Attendance rate**: green >= 80%, yellow >= 60%, red < 60%
- **Subscription usage bar**: green < 70%, yellow 70-90%, red > 90%
- **Activity state badge**: active (green), inactive (red)
