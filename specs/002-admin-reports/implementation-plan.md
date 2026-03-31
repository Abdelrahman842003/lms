# Implementation Plan: Reporting Foundation + Admin Reports

## 1) Feature Summary

We are building the first production-ready reporting architecture for a Laravel multi-tenant LMS, covering:
- **Reporting Foundation** (shared time/filter/KPI/trend/alert model)
- **Admin Reports** (platform-level operational + business reporting)

### What is being built
- A reusable reporting backend domain that standardizes periods, comparisons, KPI cards, trend direction, and drill-down behavior.
- Admin-focused report sections: executive snapshot, revenue trends, subscription health, plan breakdown, entity performance, risk alerts, and detailed drill-down tables.

### Why current reporting is insufficient
Current reporting (implicit from specs) is fragmented and likely role-specific in logic, leading to:
- inconsistent metric definitions (e.g., active student, revenue window)
- inconsistent comparisons (some sections with trend, others snapshots only)
- duplicated queries and hard-to-maintain role-based dashboards

### Why plan-based and time-based reporting is required
- Revenue model is tied to **subscription plans + linked student capacity** (not commission per transaction), so reports must emphasize:
  - plan usage pressure
  - renewals/churn/activation movement
  - linked-student growth over time
- Operational decisions require trends (`current vs previous`, `YoY where applicable`), not static totals.

---

## 2) Architecture Strategy

### Recommended backend architecture (Laravel + DDD)
Create a dedicated domain module under `backend/app/Domains/Reporting` with clear layers:
- **Application layer**: use-cases / orchestrators for report endpoints
- **Domain layer**: value objects, metric definitions, trend/alert policies
- **Infrastructure layer**: Eloquent/Query Builder repositories and SQL aggregations
- **Presentation layer**: API resources/transformers for consistent response shape

### Separation of concerns
1. **Query Services**
   - Read-only aggregation queries per concern (students, subscriptions, revenue, attendance).
   - Return raw aggregates or lightweight read models.
2. **Aggregation / Summary Builders**
   - Compose query outputs into KPI cards and section summaries.
3. **Trend Calculators**
   - Compute previous baseline, percentage deltas, direction (`up/down/stable`) with shared zero-division rules.
4. **DTOs / Resources**
   - Standard schema for KPI, trend points, breakdown rows, alerts.
5. **Filters**
   - Parse/validate/report-window normalization once; reused by all role reports.
6. **Alert Engine**
   - Stateless rule evaluators over section outputs.

### Reuse strategy for Academy/Teacher later
- Build foundation primitives now (`ReportingPeriod`, `ComparisonPeriod`, `KpiCardDTO`, `TrendMetricDTO`, `AlertDTO`).
- Keep Admin section builders role-agnostic when possible (e.g., revenue trend builder can be scoped later by academy/teacher).
- Use **scope adapters** (`PlatformScope`, future `AcademyScope`, `TeacherScope`) to avoid rewriting calculations.

### Duplication prevention
- One shared trend calculator + one shared KPI formatter.
- One shared filter normalization pipeline.
- Entity-specific data only in repositories/scoped queries.
- Avoid section-specific custom math unless explicitly required.

---

## 3) Data Model and Reporting Concepts

### Reporting period
Represent as immutable VO:
- `start_at`, `end_at`, `timezone`, `preset` (`today`, `last_7_days`, etc.)
- helper methods: duration, grain recommendation (day/month), inclusive bounds

### Comparison period
VO that derives from reporting period:
- `mode`: `previous_period` | `same_period_last_year`
- resolved window with identical duration rules

### KPI card
Standard contract:
- `key`, `title`, `current_value`, `baseline_value`, `change_pct`, `direction`, `status_color?`, `note?`, `drilldown_key?`

### Trend metric
- sequence of buckets (`label`, `value`)
- summary delta fields (`current`, `previous`, `change_pct`, `direction`)

### Alert rule
- `alert_key`, `severity` (`info/warning/critical`), `trigger_condition`, `message`, `context_payload`

### Drill-down section
- `drilldown_key`, `filters`, `columns`, `rows`, `pagination`, `sort`

### Active vs inactive students
- Active = linked student with meaningful activity in selected window (to be formalized by product rule)
- Inactive = linked but no meaningful activity in same window

### Plan usage
- `used_slots / plan_limit`, plus thresholds (`near_limit`, `over_limit`)

### Revenue trends
- realized revenue posted within period (finalized transactions/subscription invoices only)

### Subscription health
- active, expired, renewal due soon, newly activated, churned with coherent status timeline semantics

---

## 4) Domain Design

Suggested structure:

- `Domains/Reporting/Application/`
  - `GenerateAdminReportAction`
  - `GenerateAdminDrilldownAction`
  - `ExportAdminReportAction`
- `Domains/Reporting/Domain/`
  - `ValueObjects/ReportingPeriod.php`
  - `ValueObjects/ComparisonPeriod.php`
  - `ValueObjects/ReportFilters.php`
  - `Services/TrendCalculator.php`
  - `Services/AlertEngine.php`
  - `Services/KpiCardFactory.php`
- `Domains/Reporting/Infrastructure/`
  - `Queries/AdminRevenueQueryService.php`
  - `Queries/AdminSubscriptionQueryService.php`
  - `Queries/AdminEntityPerformanceQueryService.php`
  - `Queries/AdminStudentActivityQueryService.php`
- `Domains/Reporting/Presentation/`
  - `Resources/AdminReportResource.php`
  - `Resources/KpiCardResource.php`
  - `Resources/TrendResource.php`

### Responsibilities
- **Report query services**: fetch aggregates only (no presentation formatting).
- **Trend calculation services**: all delta math + direction classification + stability threshold.
- **Alert generation services**: evaluate thresholds and output ranked alerts.
- **Summary builders**: compose executive snapshot cards.
- **Breakdown builders**: produce plan/entity tables with filters/sorting/pagination.
- **Export preparation layer**: flatten summary + breakdown + filter metadata.
- **Filters/VOs**: one authoritative parsed filter object shared across all section builders.

---

## 5) Admin Report Sections

### Executive Snapshot
- **Purpose**: one-screen platform health.
- **Metrics**: total academies, total teachers, linked students, active/expired subscriptions, revenue this month/year, entities near limit.
- **Calculations**: point-in-time counts + period revenue + threshold counts.
- **Filters**: date range, plan, entity type, subscription status.
- **Foundation dependencies**: KPI card contract, filter VO, trend/direction formatter (for comparable KPIs).

### Revenue Trends
- **Purpose**: growth/decline trajectory.
- **Metrics**: current month, last month, previous month, YTD, last 12-month sequence, growth rate.
- **Calculations**: monthly bucketing, delta vs previous period, optional YoY same-month.
- **Filters**: date range, plan, entity type.
- **Dependencies**: reporting period, comparison period, trend calculator.

### Subscription Health
- **Purpose**: stability of recurring business.
- **Metrics**: active/expired, renewals due, newly activated, churned, usage distribution.
- **Calculations**: status transitions in window; renewal horizon counts.
- **Filters**: date range, plan, subscription status.
- **Dependencies**: shared status vocabulary + alert engine inputs.

### Plan Breakdown
- **Purpose**: performance by plan instead of static pricing.
- **Metrics**: entities per plan, linked students, plan revenue, avg usage.
- **Calculations**: grouped aggregations by plan + weighted usage average.
- **Filters**: plan, date range, entity type.
- **Dependencies**: plan usage formula, breakdown builders.

### Entity Performance
- **Purpose**: rank top/worst contributors and risks.
- **Metrics**: student growth, activity growth, attendance quality, revenue contribution, usage pressure.
- **Calculations**: ranking windows, growth percentage, minimum data thresholds.
- **Filters**: growth direction, usage threshold, entity type.
- **Dependencies**: trend logic + active student definition.

### Operational Risk Alerts
- **Purpose**: immediate intervention queue.
- **Metrics/Rules**: attendance drop, revenue drop, renewal congestion, inactivity spikes, over-usage.
- **Calculations**: threshold comparisons + severity scoring.
- **Filters**: date range, entity type, subscription status.
- **Dependencies**: alert engine + cross-section metrics.

### Detailed Tables / Drill-down
- **Purpose**: inspect causes behind KPI signals.
- **Tables**: academies summary, teachers summary, subscriptions summary, plan performance.
- **Calculations**: row-level derived fields (usage %, growth %, attendance %).
- **Filters**: inherited + table-specific sorting/pagination.
- **Dependencies**: drill-down registry + shared table schema.

---

## 6) API / Response Planning

Design one primary endpoint for summary + section payloads and dedicated drill-down endpoints.

### Top-level response shape
- `meta`: generated_at, timezone, report_scope, version
- `applied_filters`: normalized filter values + comparison mode
- `summary`: KPI cards array
- `sections`: keyed objects (`revenue_trends`, `subscription_health`, etc.)
- `alerts`: prioritized alert list
- `drilldowns`: available drill-down descriptors
- `export`: export token or prepared metadata map

### Comparison and direction
Include for all trendable metrics:
- `current`, `baseline`, `change_pct`, `direction`, `is_trendable`

### Nested breakdowns
- each section may include `breakdowns[]` with table schema and rows
- row entries include optional `drilldown_key`

### Filter metadata
Return:
- accepted presets
- resolved range used for execution
- ignored/normalized filter notes (if any)

### Export-ready shape
- flattened sheets/blocks:
  - `summary_kpis`
  - `section_breakdowns`
  - `detailed_rows`
  - `applied_filters`

---

## 7) Filtering and Time Logic

### Filter system design
Implement `ReportFilters` VO with:
- date range (preset/custom)
- comparison mode
- plan IDs
- entity type (`academy`, `teacher`, `all`)
- subscription status
- growth direction
- usage threshold bounds

### Date range handling
- Always normalize to timezone-aware inclusive window.
- Presets map to deterministic boundaries (e.g., month start/end in tenant/app timezone).

### Comparison consistency
- **Previous-period**: equal duration immediately before current period.
- **Same-period-last-year**: same calendar-aligned range one year back.
- Same algorithm reused by all sections and future roles.

### Entity/plan/status filters
- Apply filters at repository query boundary (not in-memory).
- Ensure each section documents unsupported filters and defaults gracefully.

---

## 8) Performance and Scalability

### Risks
- Heavy multi-join aggregates across students/sessions/subscriptions/payments.
- repeated section queries with overlapping datasets.
- N+1 in drill-down row enrichment.

### v1 strategy (simple + extensible)
- keep direct query services with grouped SQL aggregates.
- share base subqueries/CTEs for reused dimensions.
- eager-load dimensions for detailed tables.
- add targeted indexes on time/status/plan/entity keys.

### Caching
- start with short-lived cache for expensive top-level sections (e.g., 5–15 min) keyed by normalized filters + role.
- skip cache for highly dynamic drill-down pages initially.

### Future scaling
- introduce reporting snapshot/materialized tables for monthly facts when data volume grows.
- optionally queue async export generation once exports become large.

---

## 9) Phased Implementation Plan

### Phase 1: Shared Reporting Foundation
- **Goal**: establish reusable primitives and contracts.
- **Deliverables**: VOs (period/filters), KPI DTO, trend calculator, alert DTO, base resources.
- **Dependencies**: final metric definitions and time semantics.
- **Risks**: ambiguous business definitions causing rework.

### Phase 2: Admin Executive KPIs
- **Goal**: deliver executive snapshot with reliable KPIs.
- **Deliverables**: snapshot query services + summary builder + API section.
- **Dependencies**: Phase 1 contracts.
- **Risks**: data-source inconsistencies across entities.

### Phase 3: Revenue & Subscription Trends
- **Goal**: deliver trend and health visibility.
- **Deliverables**: monthly revenue trend, subscription movement metrics, comparison logic integration.
- **Dependencies**: stable revenue recognition and subscription status model.
- **Risks**: historical status reconstruction complexity.

### Phase 4: Breakdown Tables + Alerts
- **Goal**: operational drill-down and intervention cues.
- **Deliverables**: entity/plan tables, risk alert engine, drill-down endpoints.
- **Dependencies**: section metrics available and trustworthy.
- **Risks**: threshold tuning, potential query cost spikes.

### Phase 5: Export Support + Polish
- **Goal**: export parity with on-screen filters and structure.
- **Deliverables**: export payload/format layer, metadata parity checks, API contract hardening.
- **Dependencies**: stable response schemas.
- **Risks**: large export runtime; may require async jobs.

---

## 10) Validation Strategy

### Correctness
- Unit tests for KPI formulas (usage %, growth %, attendance %, churn metrics).
- Unit tests for trend calculator (positive/negative/zero/zero-baseline cases).

### Comparison logic
- tests for preset/custom date windows and previous/YoY period derivation.
- timezone boundary tests (month end, leap year, DST-sensitive boundaries where relevant).

### Edge cases
- empty datasets return valid zero-state schema.
- missing baseline produces defined behavior (`change_pct = null` or guarded default).

### Filter consistency
- feature tests confirming identical filter semantics across all sections.

### Performance
- query count assertions for key endpoints.
- load test baseline on largest expected tenant distribution (admin scope).

### Authorization
- policy/feature tests ensuring only admin role can access platform-wide report endpoints.

---

## 11) Risks and Open Questions

1. **Active student definition**
   - exact activity signals? (attendance only, session participation, assignment activity, login frequency)
2. **Revenue definition**
   - which financial events are recognized as realized revenue in reports?
3. **Attendance/session semantics**
   - effect of canceled/postponed sessions on attendance denominator.
4. **Subscription lifecycle semantics**
   - how to classify paused/trial/grace-period subscriptions.
5. **Entity scope display**
   - single mixed table vs separate academy/teacher tables in admin UI by default.
6. **Alert thresholds**
   - fixed platform-wide vs configurable per environment.
7. **Export in v1**
   - synchronous response vs async job-based generation.
8. **Historical backfill**
   - whether old records are complete enough for 12-month trend reliability.

---

## 12) Recommended Next Specs Alignment

This plan intentionally builds reusable reporting primitives so next specs can be additive:

- **For Academy Reports**
  - reuse period/filter/trend/KPI contracts
  - apply `AcademyScope` to existing query services
  - add academy-specific sections (teacher/group/session execution) using same section builders pattern

- **For Teacher Reports**
  - reuse trend, comparison, alert, and export layers unchanged
  - add `TeacherScope` and group/course-focused breakdown builders
  - keep identical response grammar to minimize frontend complexity

### Outcome
By implementing Foundation + Admin this way, Academy and Teacher reports become primarily **scope + section composition work**, not a second architecture build.
