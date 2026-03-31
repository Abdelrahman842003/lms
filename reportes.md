Specs structure
استخدم هذا التقسيم داخل مجلد specs/ بحيث يبقى التنفيذ مرتبًا وواضحًا من البداية للنهاية:

text
specs/
├── 001-reporting-foundation/
│   └── spec.md
├── 002-admin-reports/
│   └── spec.md
├── 003-academy-reports/
│   └── spec.md
└── 004-teacher-reports/
    └── spec.md
001-reporting-foundation/spec.md
text
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
- Active student = student with meaningful recent activity within the selected report window
- Inactive student = linked but not meaningfully active in the selected window
- Attendance rate = attended sessions divided by eligible sessions
- Revenue = actual realized income within the selected period
- Subscription usage = used student slots divided by plan limit
- Growth = change compared to previous matching period

## Shared Report Layout
Every report page should follow this order:
1. Header and filters
2. Top KPI cards
3. Trend section
4. Breakdown section
5. Detailed table/list section
6. Alerts and action-needed section

## Shared Alerts
All reports should support warning states such as:
- attendance dropped significantly
- revenue dropped significantly
- usage is near plan limit
- many linked students are inactive
- subscription renewal is near
- strong growth detected

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
Admin spec
002-admin-reports/spec.md
text
# Spec 002: Admin Reports

## Goal
Build a platform-level reporting experience for system administrators that shows the health, growth, revenue movement, subscription behavior, and operational risks across the entire LMS.

## Background
The Admin role is responsible for understanding overall platform performance across academies, teachers, linked students, and subscription usage in a system where subscriptions are driven by student-linked capacity. [cite:13]

## Problem
Admin reporting should not behave like a smaller version of Academy or Teacher reporting.
The Admin dashboard must answer platform questions:
- Is the platform growing?
- Which academies are growing?
- Which teachers are underperforming?
- Where is revenue increasing or declining?
- Which subscriptions are at risk?
- Which entities are near or over plan capacity?

## Primary Questions
- How many academies are active right now?
- How many teachers are active right now?
- How many linked students exist across the platform?
- What is this month’s platform revenue?
- How does this month compare to last month?
- Which subscription plans drive the most revenue?
- Which entities are most at risk operationally?

## Main Sections

### 1. Executive Snapshot
Top KPIs:
- Total Academies
- Total Teachers
- Total Linked Students
- Active Subscriptions
- Expired Subscriptions
- Platform Revenue This Month
- Platform Revenue This Year
- Entities Near Plan Limit

### 2. Revenue Trends
Must show:
- revenue this month
- revenue last month
- revenue month before last
- year-to-date revenue
- monthly revenue trend for the last 12 months
- growth or decline rate

Purpose:
This section tells the Admin whether the business is expanding, flattening, or declining.

### 3. Subscription Health
Must show:
- active subscriptions count
- expired subscriptions count
- renewals due soon
- newly activated subscriptions
- churned subscriptions
- plan usage distribution

Purpose:
This section shows whether subscription stability is strong or weak.

### 4. Plan Breakdown
Must group data by plan:
- plan name
- number of academies on the plan
- number of teachers on the plan
- total linked students under the plan
- total revenue generated by the plan
- average usage percentage

Purpose:
This section replaces any old static pricing logic with plan-based reporting.

### 5. Entity Performance
Best and worst entities by:
- student growth
- activity growth
- attendance quality
- revenue contribution
- subscription usage pressure

Tables:
- Top growing academies
- Top growing teachers
- Academies with attendance decline
- Teachers with revenue decline
- Entities close to subscription limit

### 6. Operational Risk Alerts
Examples:
- academy attendance dropped more than threshold
- teacher revenue dropped more than threshold
- many subscriptions renew within X days
- high inactivity among linked students
- academy or teacher exceeded safe usage ratio

Purpose:
The Admin must leave the page knowing where intervention is needed.

## Filters
- date range
- plan
- entity type: academy / teacher
- subscription status
- growth direction
- usage threshold

## Drill-down Behavior
- Clicking total academies opens academy breakdown
- Clicking total teachers opens teacher breakdown
- Clicking revenue opens monthly and entity contribution
- Clicking plan usage opens entities under that plan
- Clicking risk alerts opens affected entities list

## Detailed Tables
Required admin tables:
- Academies summary table
- Teachers summary table
- Subscriptions summary table
- Plan performance table

Suggested columns for academies:
- academy name
- linked students
- active students
- total teachers
- attendance rate
- plan
- usage %
- renewal date
- growth %

Suggested columns for teachers:
- teacher name
- academy or independent
- linked students
- active students
- attendance rate
- monthly revenue
- growth %
- plan
- usage %

## Acceptance Criteria
- Admin can understand total platform health in one screen.
- Revenue trends are visible by month and year-to-date.
- Plan-based performance is clearly visible.
- High-risk entities are surfaced without manual searching.
- Every high-level KPI supports drill-down.
- The page supports both operational monitoring and business decision-making.
Academy spec
003-academy-reports/spec.md
text
# Spec 003: Academy Reports

## Goal
Build an academy-level reporting experience that helps academy managers understand student activity, teacher performance, attendance quality, session execution, and subscription usage.

## Background
Academy reporting should focus on internal operations: students, teachers, groups, attendance, and whether current subscription capacity still fits the academy’s current scale. [cite:13]

## Problem
Academy managers do not need platform-wide numbers.
They need to answer academy-specific questions:
- How many students do we really have?
- How many are active?
- Which teachers are performing well?
- Which groups have weak attendance?
- Are we using our current plan efficiently?
- Is the academy improving month over month?

## Primary Questions
- How many total linked students does the academy have?
- How many are active in the selected period?
- How many teachers are currently active?
- Which teachers are responsible for the largest student load?
- Which groups have the best or worst attendance?
- How many sessions were delivered this month?
- Is student activity improving or declining?
- Are we close to the plan limit?

## Main Sections

### 1. Academy Snapshot
Top KPIs:
- Total Students
- Active Students
- New Students This Month
- Inactive Students
- Total Teachers
- Active Groups or Sections
- Sessions Delivered This Month
- Academy Attendance Rate

### 2. Student Distribution
Must show:
- students by grade
- students by group
- students by teacher
- active vs inactive students
- newly linked students over time

Purpose:
This section helps the academy understand where its student base is concentrated and where inactivity exists.

### 3. Teacher Performance
Per teacher, show:
- teacher name
- linked students count
- active students count
- attendance rate
- number of active groups
- number of delivered sessions
- trend compared to previous period

Purpose:
The academy must know which teachers are carrying large loads, which teachers maintain attendance, and which need intervention.

### 4. Attendance Quality
Must show:
- overall academy attendance rate
- attendance by teacher
- attendance by group
- attendance trend over time
- most consistent groups
- weakest groups

Purpose:
Attendance is a core operational quality metric and should be one of the main academy report pillars.

### 5. Session and Execution Report
Must show:
- sessions scheduled
- sessions delivered
- sessions canceled
- sessions postponed
- average attendance per session

Purpose:
This section reveals whether the operational side of the academy is disciplined and consistent.

### 6. Subscription Usage
Must show:
- current plan name
- current plan price
- student limit
- used student slots
- usage percentage
- renewal date
- subscription status

Purpose:
The academy should understand whether it is underusing, efficiently using, or nearing the limit of its current plan.

### 7. Time Comparison
Compare current period with:
- previous period
- last month
- same month last year where applicable

Track changes in:
- total students
- active students
- attendance rate
- sessions delivered
- usage ratio

Purpose:
A useful report must reveal direction, not only current totals.

### 8. Alerts and Action Needed
Examples:
- attendance dropped in 2 or more groups
- one teacher has unusually low attendance
- high number of inactive students
- session cancellation rate increased
- academy is near subscription limit
- renewal date approaching

## Filters
- date range
- teacher
- grade
- group
- student status
- session status

## Drill-down Behavior
- Total students → list of students by activity state
- Teacher card → teacher performance detail
- Attendance metric → breakdown by group and teacher
- Sessions delivered → session execution list
- Usage percentage → current subscription detail

## Detailed Tables
Required academy tables:
- Teacher performance table
- Group attendance table
- Session execution table
- Student activity table

Suggested teacher table columns:
- teacher name
- linked students
- active students
- attendance %
- groups count
- delivered sessions
- trend

Suggested group table columns:
- group name
- teacher
- students count
- attendance %
- sessions delivered
- inactivity rate

## Acceptance Criteria
- Academy managers can identify strong and weak teachers quickly.
- Student activity and attendance are visible by group and teacher.
- Session execution quality is measurable.
- Subscription capacity usage is clearly visible.
- The report supports operational follow-up, not only passive viewing.
Teacher spec
004-teacher-reports/spec.md
text
# Spec 004: Teacher Reports

## Goal
Build a teacher-level reporting experience that shows student load, attendance quality, session performance, income trends, and plan usage in a way that helps each teacher understand growth, decline, and next actions.

## Background
Teacher reporting should focus on personal performance, student engagement, and financial direction over time, because teachers need to know whether they are growing, stagnating, or declining in both student activity and income. [cite:13]

## Problem
Teacher reports should not only show current totals.
Teachers need time-based answers:
- How much did I earn this month?
- How does that compare to last month?
- Is my attendance improving?
- Which group performs best?
- Which group needs follow-up?
- Am I close to my subscription limit?

## Primary Questions
- How many students are linked to me?
- How many are active in the selected period?
- What is my current attendance rate?
- Which groups have the best and worst attendance?
- How much did I earn this month?
- How much did I earn last month?
- What is my year-to-date income?
- Am I trending upward or downward?
- How close am I to my current plan limit?

## Main Sections

### 1. Teacher Snapshot
Top KPIs:
- Total Linked Students
- Active Students
- Active Groups or Courses
- Attendance Rate
- Income This Month
- Income Last Month
- Year-to-Date Income
- Plan Usage %

### 2. Income Trends
Must show:
- current month income
- previous month income
- month before previous income
- year-to-date income
- monthly income trend for the last 12 months
- percentage growth or decline
- direction: up / down / stable

Purpose:
This section answers the teacher’s most practical business question: whether income is rising or falling.

### 3. Student Activity
Must show:
- linked students count
- active students count
- inactive students count
- new students this month
- student activity trend

Purpose:
The teacher must know whether growth is coming from more students, better activity, or neither.

### 4. Attendance Performance
Must show:
- overall attendance rate
- attendance by group
- attendance by session series
- best performing group
- weakest group
- attendance change from previous period

Purpose:
Attendance is one of the strongest indicators of teaching continuity and student engagement.

### 5. Group or Course Breakdown
Per group or course, show:
- group/course name
- students count
- active students count
- attendance rate
- delivered sessions
- contribution to total income where applicable
- trend

Purpose:
Teachers need to understand where effort produces the best results and where weakness exists.

### 6. Subscription and Capacity
Must show:
- current plan name
- student limit
- used student slots
- remaining capacity
- usage percentage
- renewal date
- status

Purpose:
Teachers should know whether they are operating safely within the plan or need to upgrade soon.

### 7. Alerts and Recommendations
Examples:
- income dropped compared to last month
- one or more groups have poor attendance
- student activity is declining
- teacher is near plan limit
- renewal is approaching
- one group contributes disproportionate income risk

Purpose:
The report should help the teacher take action, not just observe numbers.

## Filters
- date range
- group/course
- student activity state
- attendance state

## Drill-down Behavior
- Income This Month → monthly income detail
- Attendance Rate → attendance by group/session
- Total Students → student activity list
- Plan Usage → subscription detail
- Group performance → group-level detail

## Detailed Tables
Required teacher tables:
- Group performance table
- Monthly income table
- Student activity table
- Attendance detail table

Suggested group table columns:
- group name
- students count
- active students
- attendance %
- delivered sessions
- income contribution
- trend

Suggested monthly income table columns:
- month
- amount
- previous amount
- change %
- direction

## Acceptance Criteria
- Teachers can immediately understand whether they are growing or declining.
- Income is clearly visible by month and year-to-date.
- Attendance issues are visible by group.
- Student activity is separated from total linked count.
- Plan usage and remaining capacity are obvious.
- The report naturally leads to follow-up action.