---
title: Academy API
description: Complete reference for academy-facing API endpoints
---

# Academy API

**Base Path:** `/api/v1/academy`

Academy endpoints are split into authentication routes (no subscription check) and management routes (require `EnsureActiveSubscription` middleware). Secretary users can also access management routes.

## Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/academy/login` | Login (email + password) | No |
| POST | `/academy/logout` | Logout | Yes |
| GET | `/academy/me` | Get current profile | Yes |
| PUT | `/academy/profile` | Update profile | Yes |
| POST | `/academy/change-password` | Change password | Yes |

### Login Academy

```http
POST /api/v1/academy/login
Content-Type: application/json

{
  "email": "academy@example.com",
  "password": "secret123"
}
```

**Rate Limit:** `throttle:auth`

---

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/dashboard` | Academy statistics |

---

## Teachers Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/teachers` | List teachers |
| POST | `/academy/teachers` | Add teacher |
| GET | `/academy/teachers/{teacher}` | Get teacher |
| PUT | `/academy/teachers/{teacher}` | Update teacher |
| DELETE | `/academy/teachers/{teacher}` | Remove teacher |
| POST | `/academy/check-teacher-phone` | Check phone exists |
| PUT | `/academy/teachers/{teacher}/toggle-status` | Toggle teacher status |

---

## Secretaries Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/secretaries` | List secretaries |
| POST | `/academy/secretaries` | Create secretary |
| GET | `/academy/secretaries/{secretary}` | Get secretary |
| PUT | `/academy/secretaries/{secretary}` | Update secretary |
| DELETE | `/academy/secretaries/{secretary}` | Delete secretary |
| POST | `/academy/secretaries/check-phone` | Check phone exists |
| PUT | `/academy/secretaries/{secretary}/permissions` | Update permissions |
| PUT | `/academy/secretaries/{secretary}/toggle-status` | Toggle status |

---

## Attendance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/attendance` | Attendance records |
| GET | `/academy/attendance/today` | Today's attendance |
| POST | `/academy/attendance/mark-absent` | Mark student absent |
| PUT | `/academy/attendance/{log}/notes` | Update attendance notes |
| GET | `/academy/attendance/stats` | Attendance statistics |

---

## Lectures

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/lectures` | List lectures |
| POST | `/academy/lectures` | Create lecture |
| GET | `/academy/lectures/{lecture}` | Get lecture |
| PUT | `/academy/lectures/{lecture}` | Update lecture |
| DELETE | `/academy/lectures/{lecture}` | Delete lecture |
| GET | `/academy/lectures/teachers` | Get teachers for lectures |
| PUT | `/academy/lectures/{lecture}/toggle-active` | Toggle active |
| POST | `/academy/lectures/{lecture}/end` | End lecture |
| POST | `/academy/lectures/{lecture}/cancel-session` | Cancel session |
| POST | `/academy/lectures/{lecture}/qr-code` | Generate QR code |
| POST | `/academy/lectures/{lecture}/attendance` | Record attendance |
| GET | `/academy/lectures/{lecture}/attendees` | Get attendees |
| GET | `/academy/lectures/{lecture}/sessions` | List sessions |
| POST | `/academy/lectures/{lecture}/sessions` | Create session |

---

## Grades & Groups

### Grades

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/grades` | List grades |
| POST | `/academy/grades` | Create grade |
| GET | `/academy/grades/{grade}` | Get grade |
| PUT | `/academy/grades/{grade}` | Update grade |
| DELETE | `/academy/grades/{grade}` | Delete grade |
| PUT | `/academy/grades/bulk-update-name` | Bulk update names |
| POST | `/academy/grades/bulk-delete` | Bulk delete |

### Groups

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/groups` | List groups |
| POST | `/academy/groups` | Create group |
| GET | `/academy/groups/{group}` | Get group |
| PUT | `/academy/groups/{group}` | Update group |
| DELETE | `/academy/groups/{group}` | Delete group |

---

## Students

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/students` | List students |
| POST | `/academy/students` | Create student |
| GET | `/academy/students/{id}` | Get student |
| PUT | `/academy/students/{id}` | Update student |
| DELETE | `/academy/students/{id}` | Delete student |
| GET | `/academy/students/statistics` | Student statistics |
| GET | `/academy/students/search-phone` | Search by phone |
| PUT | `/academy/students/{id}/toggle-status` | Toggle status |

---

## Exams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/exams` | List exams |
| POST | `/academy/exams` | Create exam |
| GET | `/academy/exams/{exam}` | Get exam |
| PUT | `/academy/exams/{exam}` | Update exam |
| DELETE | `/academy/exams/{exam}` | Delete exam |
| GET | `/academy/exams/teachers` | Get teachers for exams |
| GET | `/academy/exams/{exam}/results` | Get exam results |
| PUT | `/academy/exams/{exam}/toggle-status` | Toggle status |
| POST | `/academy/exams/{exam}/copy` | Copy exam |
| PUT | `/academy/exams/{exam}/end` | End exam |

---

## Videos

### Upload (Multipart to R2)

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/academy/videos/initiate-upload` | Start upload | `video-upload` |
| POST | `/academy/videos/complete-upload` | Complete upload | - |
| DELETE | `/academy/videos/abort-upload` | Abort upload | - |
| GET | `/academy/videos/upload-status/{sessionId}` | Upload status | - |

### CRUD & Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/videos` | List videos |
| GET | `/academy/videos/{video}` | Get video |
| PUT | `/academy/videos/{video}` | Update video |
| DELETE | `/academy/videos/{video}` | Delete video |
| POST | `/academy/videos/{video}/attachments` | Upload attachment |
| DELETE | `/academy/videos/{video}/attachments/{attachment}` | Delete attachment |
| POST | `/academy/videos/{video}/retry-processing` | Retry processing |
| POST | `/academy/videos/{video}/publish` | Publish video |
| GET | `/academy/videos/{video}/comments` | List comments |
| POST | `/academy/videos/{video}/comments/{commentId}/hide` | Hide comment |
| DELETE | `/academy/videos/{video}/comments/{commentId}` | Delete comment |

### Video Quiz

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/videos/{video}/quiz` | Get quiz |
| POST | `/academy/videos/{video}/quiz` | Create quiz |
| PUT | `/academy/videos/{video}/quiz` | Update quiz |
| DELETE | `/academy/videos/{video}/quiz` | Delete quiz |
| GET | `/academy/videos/{video}/quiz/results` | Quiz results |

---

## Payments

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/academy/payments` | Create payment | `payments` |

---

## Subscription

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/academy/subscription` | Get subscription | - |
| POST | `/academy/subscription/renew` | Request renewal | `payments` |

---

## Notifications

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/academy/notifications` | List notifications | - |
| GET | `/academy/notifications/unread-count` | Unread count | - |
| POST | `/academy/notifications` | Send notification | `notifications` |
| POST | `/academy/notifications/{id}/read` | Mark as read | `notifications` |
| POST | `/academy/notifications/send-to-teachers` | Send to all teachers | `notifications` |

---

## Reports

### Legacy Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/reports/attendance` | Attendance report |
| GET | `/academy/reports/teachers` | Teachers report |
| GET | `/academy/reports/monthly` | Monthly report |
| GET | `/academy/reports/export-pdf` | Export as PDF |

### Reporting Foundation (v2)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/reports/overview` | Academy overview |
| GET | `/academy/reports/snapshot` | KPI snapshot |
| GET | `/academy/reports/student-distribution` | Student distribution |
| GET | `/academy/reports/teacher-performance` | Teacher performance |
| GET | `/academy/reports/attendance-quality` | Attendance quality |
| GET | `/academy/reports/session-execution` | Session execution |
| GET | `/academy/reports/subscription-usage` | Subscription usage |
| GET | `/academy/reports/time-comparison` | Time comparison |
| GET | `/academy/reports/alerts` | Active alerts |

---

## Gamification

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/leaderboard` | Student leaderboard |

---

## Permissions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/academy/permissions` | List permissions |

---

## References

- [Authentication](/backend/api/authentication) - Login flow
- [Response Format](/backend/api/response-format) - Standard response structure
- [Auth Domain](/backend/domains/auth) - Academy model
- [Reporting Domain](/backend/domains/reporting) - Analytics and KPIs
- [Subscriptions Domain](/backend/domains/subscriptions) - Subscription management
