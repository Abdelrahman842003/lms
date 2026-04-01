---
title: Services Reference
description: Complete catalog of all frontend service modules and their API endpoints
---

# Services Reference

## Base API

**Source:** `frontend/src/services/api/baseApi.ts`

| Export | Description |
|--------|-------------|
| `fetchApi<T>` | Generic fetch wrapper with auth headers and CSRF |
| `getAuthHeaders()` | Builds Bearer token + CSRF headers |

## Auth Services

### authService.ts
**Source:** `frontend/src/services/authService.ts`

| Function | Description |
|----------|-------------|
| Login (per role) | Login endpoints for teacher, student, parent, academy, secretary |
| Session validation | Validate current session |
| Token refresh | Refresh expired tokens |

## Teacher Services

### teacherService.ts
**Source:** `frontend/src/services/teacherService.ts`

Core teacher operations — attendance scanning, grades, groups, dashboard data.

### Teacher Modules (`services/teacher/modules/`)

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `dashboardService.ts` | `/api/teacher/dashboard/*` | Stats, recent students, upcoming lectures, performance, revenue |
| `studentsService.ts` | `/teacher/students/*` | Student CRUD, search, activation, payments |
| `gradesService.ts` | `/teacher/grades/*` | Grade CRUD, statistics |
| `groupsService.ts` | `/teacher/groups/*` | Group CRUD, student assignment |
| `lecturesService.ts` | `/teacher/lectures/*` | Lecture CRUD, QR codes, attendance |

## Academy Service

**Source:** `frontend/src/services/academyService.ts`

Comprehensive academy management: dashboard stats, teachers, secretaries, students, attendance, notifications, reports, lectures, exams, gamification. Endpoints under `/academy/*`.

## Video Service

**Source:** `frontend/src/services/videoService.ts`

| Operation | Endpoints |
|-----------|-----------|
| Upload lifecycle | Initiate, complete, abort multipart upload |
| Video CRUD | List, publish, delete videos |
| Playback | Issue tokens, get progress, update progress |
| Quizzes | CRUD for video quizzes |
| Comments | List, add, delete comments |
| Attachments | Manage video attachments |

## Report Services

### teacherReportService.ts
| Function | Endpoint |
|----------|----------|
| `fetchTeacherReportOverview` | `GET /teacher/reports/overview` |
| `fetchTeacherDrilldown` | `GET /teacher/reports/drilldown/{key}` |

### academyReportService.ts
| Function | Endpoint |
|----------|----------|
| Snapshot | `GET /academy/reports/snapshot` |
| Student distribution | `GET /academy/reports/student-distribution` |
| Teacher performance | `GET /academy/reports/teacher-performance` |
| Attendance quality | `GET /academy/reports/attendance-quality` |
| Session execution | `GET /academy/reports/session-execution` |
| Subscription usage | `GET /academy/reports/subscription-usage` |
| Time comparison | `GET /academy/reports/time-comparison` |
| Alerts | `GET /academy/reports/alerts` |

## Lecture Service

**Source:** `frontend/src/services/lectureService.ts`

Lecture CRUD, QR code generation, attendance recording, PDF export, session management. Endpoints under `/api/teacher/lectures/*`.

## Notification Service

**Source:** `frontend/src/services/notificationService.ts`

Send notifications (recipient types: all, grade, group, admin, all_users, all_teachers, all_students, all_secretaries), voice notifications with duration limits, device token registration. Dynamic endpoint based on user type.

## Subscription Service

**Source:** `frontend/src/services/subscriptionService.ts`

| Function | Endpoint |
|----------|----------|
| Teacher subscription | `GET /teacher/subscription` |
| Academy subscription | `GET /academy/subscription` |
| Teacher renew | `POST /teacher/subscription/renew` |
| Academy renew | `POST /academy/subscription/renew` |

## Payment Service

**Source:** `frontend/src/services/paymentService.ts`

Payment CRUD, statistics, confirmation codes, status filtering. Endpoints under `/api/teacher/payments/*` and `/api/student/payments/*`.

## Secretary Service

**Source:** `frontend/src/services/secretaryService.ts`

Secretary CRUD, phone validation, permission management, status toggling. Endpoints under `/api/teacher/secretaries/*`.

## Grade Service

**Source:** `frontend/src/services/gradeService.ts`

Grade CRUD with pagination/search. Endpoints under `/api/teacher/grades/*`.

## Group Service

**Source:** `frontend/src/services/groupService.ts`

Group CRUD with student management. Supports `general` and `private` types. Endpoints under `/api/teacher/groups/*`.

## Avatar Service

**Source:** `frontend/src/services/avatarService.ts`

Avatar upload (FormData), delete, and URL retrieval. Endpoints under `/api/avatar/*`.

## Settings Service

**Source:** `frontend/src/services/settingsService.ts`

| Function | Endpoint |
|----------|----------|
| `getPublicSettings` | `GET /api/v1/public-settings` |

## Roles Service

**Source:** `frontend/src/services/roles.ts`

Role-based permission retrieval for teachers and academies.
