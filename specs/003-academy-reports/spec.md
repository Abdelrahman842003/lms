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
