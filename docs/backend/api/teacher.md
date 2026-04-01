---
title: Teacher API
description: Complete reference for teacher-facing API endpoints
---

# Teacher API

**Base Path:** `/api/v1/teacher`

All teacher endpoints require `auth:sanctum` middleware and the `EnsureUserNotSuspended` + `EnsureActiveSubscription` middleware checks.

## Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/register/teacher` | Register new teacher | No |
| POST | `/api/v1/login/teacher` | Login (phone + password) | No |
| POST | `/teacher/logout` | Logout | Yes |
| GET | `/teacher/me` | Get current profile | Yes |
| PUT | `/teacher/profile` | Update profile | Yes |
| POST | `/teacher/change-password` | Change password | Yes |

### Register Teacher

```http
POST /api/v1/register/teacher
Content-Type: application/json

{
  "name": "Ahmed Teacher",
  "phone": "201234567890",
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

**Rate Limit:** `throttle:register`

---

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/dashboard/stats` | Dashboard statistics |
| GET | `/teacher/dashboard/students` | Recent students |
| GET | `/teacher/dashboard/lectures` | Upcoming lectures |
| GET | `/teacher/dashboard/academies` | Teacher's academies |

---

## Student Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/students` | List students |
| POST | `/teacher/students` | Create student |
| GET | `/teacher/students/{student}` | Get student details |
| PUT | `/teacher/students/{student}` | Update student |
| DELETE | `/teacher/students/{student}` | Delete student |
| GET | `/teacher/students/statistics` | Student statistics |
| GET | `/teacher/students/search-phone` | Search by phone number |
| PUT | `/teacher/students/{student}/permissions` | Update permissions |
| PUT | `/teacher/students/{student}/toggle-status` | Toggle active status |
| GET | `/teacher/students/{student}/activation-details` | Get activation details |
| PUT | `/teacher/students/{student}/activate` | Activate student |

### Search by Phone

```http
GET /teacher/students/search-phone?phone=201234567890
```

---

## Grades & Groups

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/grades` | List grades |
| POST | `/teacher/grades` | Create grade |
| GET | `/teacher/grades/{grade}` | Get grade |
| PUT | `/teacher/grades/{grade}` | Update grade |
| DELETE | `/teacher/grades/{grade}` | Delete grade |
| GET | `/teacher/groups` | List groups |
| POST | `/teacher/groups` | Create group |
| GET | `/teacher/groups/{group}` | Get group |
| PUT | `/teacher/groups/{group}` | Update group |
| DELETE | `/teacher/groups/{group}` | Delete group |

---

## Lectures

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/lectures` | List lectures |
| POST | `/teacher/lectures` | Create lecture |
| GET | `/teacher/lectures/{lecture}` | Get lecture |
| PUT | `/teacher/lectures/{lecture}` | Update lecture |
| DELETE | `/teacher/lectures/{lecture}` | Delete lecture |
| PUT | `/teacher/lectures/{lecture}/toggle-active` | Toggle active |
| POST | `/teacher/lectures/{lecture}/end` | End lecture |
| POST | `/teacher/lectures/{lecture}/cancel-session` | Cancel session |
| GET | `/teacher/lectures/{lecture}/attendees` | Get attendees |
| GET | `/teacher/lectures/{lecture}/attendees/export` | Export attendees |
| GET | `/teacher/lectures/{lecture}/sessions` | List sessions |
| POST | `/teacher/lectures/{lecture}/sessions` | Create session |

---

## Exams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/exams` | List exams |
| POST | `/teacher/exams` | Create exam |
| GET | `/teacher/exams/{exam}` | Get exam |
| PUT | `/teacher/exams/{exam}` | Update exam |
| DELETE | `/teacher/exams/{exam}` | Delete exam |
| GET | `/teacher/exams/{exam}/results` | Get exam results |
| PUT | `/teacher/exams/{exam}/toggle-status` | Toggle status |
| POST | `/teacher/exams/{exam}/copy` | Copy exam |
| PUT | `/teacher/exams/{exam}/end` | End exam |

---

## Videos

### Upload (Multipart to R2)

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/teacher/videos/initiate-upload` | Start upload session | `video-upload` |
| POST | `/teacher/videos/complete-upload` | Complete upload | - |
| DELETE | `/teacher/videos/abort-upload` | Abort upload | - |
| GET | `/teacher/videos/upload-status/{sessionId}` | Check upload status | - |

### CRUD & Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/videos` | List videos |
| GET | `/teacher/videos/{video}` | Get video |
| PUT | `/teacher/videos/{video}` | Update video |
| DELETE | `/teacher/videos/{video}` | Delete video |
| POST | `/teacher/videos/{video}/attachments` | Upload attachment |
| DELETE | `/teacher/videos/{video}/attachments/{attachment}` | Delete attachment |
| POST | `/teacher/videos/{video}/retry-processing` | Retry processing |
| POST | `/teacher/videos/{video}/publish` | Publish video |
| GET | `/teacher/videos/{video}/thumbnail` | Get thumbnail |
| GET | `/teacher/videos/{video}/thumbnail-url` | Get thumbnail URL |

### Streaming

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/teacher/videos/{video}/stream` | Stream video | `video-stream` |
| GET | `/teacher/videos/{video}/stream-url` | Get stream URL | `video-stream` |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/videos/{video}/comments` | List comments |
| POST | `/teacher/videos/{video}/comments/{commentId}/hide` | Hide comment |
| DELETE | `/teacher/videos/{video}/comments/{commentId}` | Delete comment |

### Video Quiz

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/videos/{video}/quiz` | Get quiz |
| POST | `/teacher/videos/{video}/quiz` | Create quiz |
| PUT | `/teacher/videos/{video}/quiz` | Update quiz |
| DELETE | `/teacher/videos/{video}/quiz` | Delete quiz |
| GET | `/teacher/videos/{video}/quiz/results` | Get quiz results |

---

## Payments

### Read Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/payments` | List payment logs |
| GET | `/teacher/payments/pending` | Pending payments |
| GET | `/teacher/payments/statistics` | Payment statistics |
| GET | `/teacher/payments/{payment}` | Get payment details |

### Write Operations (Rate Limited: `throttle:payments`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/teacher/payments` | Create payment |
| POST | `/teacher/payments/sync` | Sync batch payments |
| POST | `/teacher/payments/{payment}/cancel` | Cancel payment |
| POST | `/teacher/students/{student}/payments` | Create student payment |

---

## Notifications

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/teacher/notifications` | List notifications | - |
| GET | `/teacher/notifications/voice-limit` | Check voice limit | - |
| POST | `/teacher/notifications` | Send notification | `notifications` |
| POST | `/teacher/notifications/{id}/read` | Mark as read | `notifications` |
| POST | `/teacher/notifications/voice` | Send voice notification | `voice-notifications` |

---

## Attendance (QR Scanning)

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/teacher/scan/checkin` | QR check-in | `attendance` |
| POST | `/teacher/scan/checkout` | QR check-out | `attendance` |
| GET | `/teacher/scan/today-status` | Today's status | - |

---

## Reports

### Legacy Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/reports/my-report` | Teacher report data |
| GET | `/teacher/reports/my-report/pdf` | Export as PDF |

### Reporting Domain (v2)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/reports/overview` | Report overview with KPIs |
| GET | `/teacher/reports/drilldown/{key}` | Drill-down into metric |

---

## Subscription

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/teacher/subscription` | Get subscription details | - |
| POST | `/teacher/subscription/renew` | Request renewal | `payments` |

---

## Gamification

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/leaderboard` | Student leaderboard |
| GET | `/teacher/gamification/settings` | Get gamification settings |
| PUT | `/teacher/gamification/settings` | Update settings |
| POST | `/teacher/gamification/bonus` | Award bonus points |
| GET | `/teacher/students/{student}/points` | Student points |

---

## Secretary Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/secretaries` | List secretaries |
| POST | `/teacher/secretaries` | Create secretary |
| GET | `/teacher/secretaries/{secretary}` | Get secretary |
| PUT | `/teacher/secretaries/{secretary}` | Update secretary |
| DELETE | `/teacher/secretaries/{secretary}` | Delete secretary |
| POST | `/teacher/secretaries/check-phone` | Check phone exists |
| PUT | `/teacher/secretaries/{secretary}/permissions` | Update permissions |
| PUT | `/teacher/secretaries/{secretary}/toggle-status` | Toggle status |

---

## Sync Errors

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/sync-errors` | List sync errors |
| GET | `/teacher/sync-errors/count` | Unresolved count |
| GET | `/teacher/sync-errors/{error}` | Get error details |
| POST | `/teacher/sync-errors/{error}/resolve` | Resolve error |
| POST | `/teacher/sync-errors/bulk-resolve` | Bulk resolve |

---

## Permissions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/permissions` | List permissions |
| POST | `/teacher/permissions` | Create permission |
| GET | `/teacher/permissions/{permission}` | Get permission |
| PUT | `/teacher/permissions/{permission}` | Update permission |
| DELETE | `/teacher/permissions/{permission}` | Delete permission |

---

## References

- [Authentication](/backend/api/authentication) - Login flow
- [Response Format](/backend/api/response-format) - Standard response structure
- [Auth Domain](/backend/domains/auth) - Teacher model
- [Subscriptions Domain](/backend/domains/subscriptions) - Subscription management
