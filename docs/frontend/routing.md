---
title: Frontend Routing
description: Complete route structure, middleware, and navigation for all roles
---

# Frontend Routing

Routes are organized by role using directory-based path segments. Each role has its own prefix and layout.

## Route Map

### Shared Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Landing page | Public landing page |
| `/login` | Login | Multi-role login |
| `/maintenance` | Maintenance | Maintenance mode overlay |
| `*` | 404 | Not found page |

### Teacher Routes (`/teacher/`)

| Path | Description |
|------|-------------|
| `/teacher/dashboard` | Teacher dashboard with stats |
| `/teacher/students` | Student list |
| `/teacher/students/add` | Add new student |
| `/teacher/students/[id]` | Student details |
| `/teacher/students/[id]/edit` | Edit student |
| `/teacher/students/[id]/payment` | Student payment |
| `/teacher/lectures` | Lecture list |
| `/teacher/lectures/create` | Create lecture |
| `/teacher/lectures/[id]/attendance` | Lecture attendance |
| `/teacher/exams` | Exam list |
| `/teacher/exams/add` | Create exam |
| `/teacher/exams/[id]` | Exam details |
| `/teacher/exams/[id]/edit` | Edit exam |
| `/teacher/exams/[id]/results` | Exam results |
| `/teacher/attendance` | Attendance management |
| `/teacher/grades` | Grade management |
| `/teacher/groups` | Group list |
| `/teacher/groups/[id]` | Group details |
| `/teacher/secretaries` | Secretary list |
| `/teacher/secretaries/add` | Add secretary |
| `/teacher/secretaries/[id]/edit` | Edit secretary |
| `/teacher/gamification` | Gamification features |
| `/teacher/notifications` | Notifications |
| `/teacher/notifications/students` | Student notifications |
| `/teacher/notifications/developer` | Developer notifications |
| `/teacher/reports` | Teacher reports & analytics |
| `/teacher/videos` | Video list |
| `/teacher/videos/create` | Upload video |
| `/teacher/videos/[id]` | Video details |
| `/teacher/subscription` | Subscription management |
| `/teacher/profile` | Profile settings |

### Student Routes (`/student/`)

| Path | Description |
|------|-------------|
| `/student/dashboard` | Student dashboard |
| `/student/exams` | Exam list |
| `/student/exams/[id]/take` | Take exam |
| `/student/lectures` | Lecture list |
| `/student/attend` | QR attendance check-in |
| `/student/leaderboard` | Gamification leaderboard |
| `/student/mistakes` | Mistake tracking |
| `/student/mistakes/quiz` | Mistake quiz |
| `/student/notifications` | Notifications |
| `/student/teachers` | Teacher information |
| `/student/videos` | Video list |
| `/student/videos/[id]` | Watch video |
| `/student/profile` | Profile settings |

### Parent Routes (`/parent/`)

| Path | Description |
|------|-------------|
| `/parent/dashboard` | Parent dashboard |
| `/parent/children` | Children management |
| `/parent/profile` | Profile settings |
| `/parent/[childId]/summary` | Child progress summary |

### Academy Routes (`/academy/`)

| Path | Description |
|------|-------------|
| `/academy/dashboard` | Academy dashboard |
| `/academy/students` | Student list |
| `/academy/students/add` | Add student |
| `/academy/students/[id]` | Student details |
| `/academy/students/[id]/edit` | Edit student |
| `/academy/students/[id]/payment` | Student payment |
| `/academy/teachers` | Teacher list |
| `/academy/teachers/[id]` | Teacher details |
| `/academy/lectures` | Lecture list |
| `/academy/lectures/create` | Create lecture |
| `/academy/lectures/[id]/attendees` | Lecture attendees |
| `/academy/lectures/[id]/manual-attendance` | Manual attendance |
| `/academy/exams` | Exam list |
| `/academy/exams/add` | Create exam |
| `/academy/exams/[id]` | Exam details |
| `/academy/exams/[id]/edit` | Edit exam |
| `/academy/exams/[id]/results` | Exam results |
| `/academy/attendance` | Attendance management |
| `/academy/grades` | Grade list |
| `/academy/grades/[gradeName]` | Grade details |
| `/academy/groups` | Group management |
| `/academy/secretaries` | Secretary list |
| `/academy/secretaries/add` | Add secretary |
| `/academy/gamification` | Gamification features |
| `/academy/notifications` | Notifications |
| `/academy/reports` | Academy reports & analytics |
| `/academy/videos` | Video list |
| `/academy/videos/create` | Upload video |
| `/academy/videos/[id]` | Video details |
| `/academy/billing` | Billing & payments |
| `/academy/subscription` | Subscription management |
| `/academy/profile` | Profile settings |

## Middleware

**Source:** `frontend/src/middleware.ts`

The middleware runs on all requests except static files and handles:

### Cookie-Based Session Check
- Checks `auth_state` cookie for authentication status
- Checks `user_role` cookie for role identification

### Protected Routes
All routes starting with `/teacher`, `/student`, `/parent`, `/academy`, or `/secretary` require authentication. Unauthenticated users are redirected to `/login?redirect=<original-path>`.

### Role-to-Dashboard Mapping

| Role | Default Redirect |
|------|-----------------|
| `teacher` | `/teacher/dashboard` |
| `student` | `/student/dashboard` |
| `parent` | `/parent/children` |
| `academy` | `/academy/dashboard` |
| `secretary` | `/secretary/dashboard` |

### Auth Route Redirect
Authenticated users visiting `/login`, `/register`, or `/` are redirected to their role's dashboard.

## Layout Structure

Each role has its own layout providing the sidebar and navbar:

```
app/
├── layout.tsx              # Root layout (providers, fonts, globals)
├── teacher/layout.tsx      # Teacher layout (sidebar + navbar)
├── student/layout.tsx      # Student layout
├── parent/layout.tsx       # Parent layout
└── academy/                # Academy uses its own layout from dashboard
```

## Dynamic Route Parameters

| Parameter | Used In | Description |
|-----------|---------|-------------|
| `[id]` | Students, exams, lectures, groups, secretaries, teachers, videos | Entity ID |
| `[childId]` | Parent summary | Selected child ID |
| `[gradeName]` | Academy grades | Grade name slug |
