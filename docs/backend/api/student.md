---
title: Student API
description: Complete reference for student-facing API endpoints
---

# Student API

**Base Path:** `/api/v1/student`

All student endpoints require `auth:sanctum` middleware and pass through the `EnsureTeacherNotSuspendedForStudent` middleware.

## Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/login/student` | Login (phone + password) | No |
| POST | `/student/logout` | Logout | Yes |
| GET | `/student/me` | Get current profile | Yes |
| POST | `/student/change-password` | Change password | Yes |

### Login Student

```http
POST /api/v1/login/student
Content-Type: application/json

{
  "phone": "201234567890",
  "password": "secret123"
}
```

**Rate Limit:** `throttle:auth`

---

## Teacher Selection & Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/teachers` | List available teachers |
| GET | `/student/teachers/{teacher}/dashboard` | Teacher dashboard data |
| GET | `/student/dashboard` | Student dashboard |

---

## Attendance

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/student/attend` | Mark attendance | `attendance` |
| GET | `/student/attendance` | Attendance history | - |

### Mark Attendance

```http
POST /student/attend
Content-Type: application/json

{
  "lecture_id": "uuid",
  "qr_code": "string"
}
```

---

## Exams

### Browsing Exams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/exams` | List available exams |
| GET | `/student/exams/{exam}` | Get exam details |

### Taking Exams

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/student/exams/{exam}/start` | Start exam attempt | - |
| POST | `/student/exams/attempts/{attempt}/answer` | Submit answer | `exam-submit` |
| POST | `/student/exams/attempts/{attempt}/skip` | Skip question | `exam-submit` |
| POST | `/student/exams/attempts/{attempt}/terminate` | End attempt | - |
| GET | `/student/exams/attempts/{attempt}/status` | Attempt status | - |
| GET | `/student/exams/{exam}/result` | Exam result | - |

### Start Exam

```http
POST /student/exams/{exam}/start
```

### Submit Answer

```http
POST /student/exams/attempts/{attempt}/answer
Content-Type: application/json

{
  "question_id": "uuid",
  "answer": "selected_option"
}
```

---

## Lectures

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/lectures` | List lectures |

---

## Videos

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/student/videos` | List videos | - |
| GET | `/student/videos/{video}` | Get video | - |
| POST | `/student/videos/{video}/playback-token` | Issue playback token | `video-playback` |
| GET | `/student/videos/{video}/stream-url` | Get stream URL | `video-playback` |
| GET | `/student/videos/{video}/thumbnail` | Get thumbnail | - |
| GET | `/student/videos/{video}/attachments/{attachmentId}` | Download attachment | - |
| GET | `/student/videos/{video}/attachments/{attachmentId}/view-url` | View attachment URL | - |
| POST | `/student/videos/{video}/progress` | Update watch progress | - |
| POST | `/student/videos/{video}/like` | Toggle like | - |

### Get Playback Token

```http
POST /student/videos/{video}/playback-token
```

Returns a short-lived token for video streaming authorization.

### Update Progress

```http
POST /student/videos/{video}/progress
Content-Type: application/json

{
  "position_seconds": 120,
  "duration_seconds": 300,
  "percentage": 40.0
}
```

---

## Video Quiz

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/videos/{video}/quiz` | Get quiz |
| POST | `/student/videos/{video}/quiz/submit` | Submit quiz answers |
| GET | `/student/videos/{video}/quiz/attempts` | Get quiz attempts |

---

## Notifications

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/student/notifications` | List notifications | - |
| POST | `/student/notifications` | Create notification | `notifications` |
| POST | `/student/notifications/{id}/read` | Mark as read | `notifications` |

---

## Gamification

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/points` | All points overview |
| GET | `/student/points/{teacher}` | Points for specific teacher |
| GET | `/student/points/{teacher}/history` | Point transaction history |
| GET | `/student/leaderboard/{teacher}` | Teacher leaderboard |

---

## Mistakes (Smart Mistakes Notebook)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/student/mistakes` | List mistakes |
| POST | `/student/mistakes/{id}/mastered` | Mark as mastered |

### List Mistakes

```http
GET /student/mistakes?teacher_id=uuid&exam_id=uuid
```

Returns incorrect answers with question details for review.

---

## References

- [Authentication](/backend/api/authentication) - Login flow
- [Response Format](/backend/api/response-format) - Standard response structure
- [Auth Domain](/backend/domains/auth) - Student model
- [Exams Domain](/backend/domains/exams) - Exam logic
- [Videos Domain](/backend/domains/videos) - Video system
