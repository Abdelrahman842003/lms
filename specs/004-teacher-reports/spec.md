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
