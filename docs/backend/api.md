# API Reference

## Overview

The platform provides a RESTful API for all client applications. All API routes are versioned and prefixed with `/api/v1/`.

## Authentication

All authenticated endpoints require a valid Sanctum token. Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Rate Limiting

The API implements rate limiting on sensitive endpoints:

| Throttle Key | Limit | Endpoints |
|--------------|-------|-----------|
| `auth` | 5/minute | Login, Register |
| `token-refresh` | 10/minute | Token refresh |
| `notifications` | 30/minute | Send notifications |
| `voice-notifications` | 10/hour | Voice notifications |
| `payments` | 10/minute | Payment operations |
| `video-upload` | 3/minute | Video upload initiation |
| `video-stream` | 60/minute | Video streaming |
| `video-playback` | 30/minute | Playback tokens |
| `attendance` | 30/minute | Attendance marking |
| `exam-submit` | 60/minute | Exam answer submission |
| `avatar-upload` | 5/minute | Avatar upload |
| `uploads` | 10/minute | General file uploads |

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "errors": {
        "field": ["Validation error message"]
    }
}
```

---

## Authentication Endpoints

### Login Routes

| Method | Endpoint | Guard | Description |
|--------|----------|-------|-------------|
| POST | `/api/v1/academy/login` | academy | Academy admin login |
| POST | `/api/v1/login/teacher` | teacher | Teacher login |
| POST | `/api/v1/login/student` | student | Student login |
| POST | `/api/v1/login/parent` | guardian | Guardian/Parent login |
| POST | `/api/v1/login/secretary` | secretary | Secretary login |

### Login Request Body
```json
{
    "phone": "+201234567890",
    "password": "password123",
    "device_name": "mobile-app"
}
```

### Login Response
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "User Name",
            "phone": "+201234567890",
            "email": "user@example.com"
        },
        "token": "1|abcdef123456..."
    }
}
```

### Token Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| POST | `/api/v1/auth/logout` | Yes | Logout from all devices |
| POST | `/api/v1/auth/logout-current` | Yes | Logout from current device |
| POST | `/api/v1/auth/logout-others` | Yes | Logout from other devices |
| GET | `/api/v1/auth/token-info` | Yes | Get token information |

### Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/{guard}/me` | Yes | Get current user profile |
| PUT | `/api/v1/{guard}/profile` | Yes | Update profile |
| POST | `/api/v1/{guard}/change-password` | Yes | Change password |

---

## Academy Endpoints

Base path: `/api/v1/academy`

**Middleware:** `auth:sanctum`, `EnsureActiveSubscription`

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get academy dashboard statistics |

### Teachers Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teachers` | List all teachers |
| GET | `/teachers/{id}` | Get teacher details |
| POST | `/teachers` | Create new teacher |
| PUT | `/teachers/{id}` | Update teacher |
| DELETE | `/teachers/{id}` | Delete teacher |
| PUT | `/teachers/{id}/toggle-status` | Activate/deactivate teacher |
| POST | `/check-teacher-phone` | Check if phone exists |

### Secretaries Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/secretaries` | List all secretaries |
| GET | `/secretaries/{id}` | Get secretary details |
| POST | `/secretaries` | Create new secretary |
| PUT | `/secretaries/{id}` | Update secretary |
| DELETE | `/secretaries/{id}` | Delete secretary |
| PUT | `/secretaries/{id}/permissions` | Update permissions |
| PUT | `/secretaries/{id}/toggle-status` | Activate/deactivate |
| POST | `/secretaries/check-phone` | Check if phone exists |

### Students Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List all students |
| GET | `/students/{id}` | Get student details |
| POST | `/students` | Create new student |
| PUT | `/students/{id}` | Update student |
| DELETE | `/students/{id}` | Delete student |
| GET | `/students/statistics` | Get student statistics |
| GET | `/students/search-phone` | Search by phone number |
| PUT | `/students/{id}/toggle-status` | Activate/deactivate |

### Grades & Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/grades` | List all grades |
| POST | `/grades` | Create grade |
| PUT | `/grades/{id}` | Update grade |
| DELETE | `/grades/{id}` | Delete grade |
| PUT | `/grades/bulk-update-name` | Bulk update grade names |
| POST | `/grades/bulk-delete` | Bulk delete grades |
| GET | `/groups` | List all groups |
| POST | `/groups` | Create group |
| PUT | `/groups/{id}` | Update group |
| DELETE | `/groups/{id}` | Delete group |

### Lectures Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lectures` | List all lectures |
| GET | `/lectures/{id}` | Get lecture details |
| POST | `/lectures` | Create lecture |
| PUT | `/lectures/{id}` | Update lecture |
| DELETE | `/lectures/{id}` | Delete lecture |
| PUT | `/lectures/{id}/toggle-active` | Toggle active status |
| POST | `/lectures/{id}/end` | End lecture |
| POST | `/lectures/{id}/qr-code` | Generate QR code |
| POST | `/lectures/{id}/attendance` | Record attendance |
| GET | `/lectures/{id}/attendees` | Get attendees list |
| GET | `/lectures/{id}/sessions` | Get lecture sessions |
| POST | `/lectures/{id}/sessions` | Create lecture session |
| GET | `/lectures/teachers` | Get teachers for lectures |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance` | List attendance records |
| GET | `/attendance/today` | Today's attendance |
| POST | `/attendance/mark-absent` | Mark student absent |
| PUT | `/attendance/{id}/notes` | Update attendance notes |
| GET | `/attendance/stats` | Attendance statistics |

### Exams Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams` | List all exams |
| GET | `/exams/{id}` | Get exam details |
| POST | `/exams` | Create exam |
| PUT | `/exams/{id}` | Update exam |
| DELETE | `/exams/{id}` | Delete exam |
| PUT | `/exams/{id}/toggle-status` | Toggle exam status |
| POST | `/exams/{id}/copy` | Copy exam |
| PUT | `/exams/{id}/end` | End exam |
| GET | `/exams/{id}/results` | Get exam results |
| GET | `/exams/teachers` | Get teachers for exams |

### Videos Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos` | List all videos |
| GET | `/videos/{id}` | Get video details |
| PUT | `/videos/{id}` | Update video |
| DELETE | `/videos/{id}` | Delete video |
| POST | `/videos/initiate-upload` | Initiate multipart upload |
| POST | `/videos/complete-upload` | Complete upload |
| DELETE | `/videos/abort-upload` | Abort upload |
| GET | `/videos/upload-status/{sessionId}` | Get upload status |
| POST | `/videos/{id}/attachments` | Upload attachment |
| DELETE | `/videos/{id}/attachments/{attachmentId}` | Delete attachment |
| POST | `/videos/{id}/retry-processing` | Retry video processing |
| POST | `/videos/{id}/publish` | Publish video |
| GET | `/videos/{id}/comments` | Get video comments |
| POST | `/videos/{id}/comments/{commentId}/hide` | Hide comment |
| DELETE | `/videos/{id}/comments/{commentId}` | Delete comment |

### Video Quiz

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos/{id}/quiz` | Get video quiz |
| POST | `/videos/{id}/quiz` | Create quiz |
| PUT | `/videos/{id}/quiz` | Update quiz |
| DELETE | `/videos/{id}/quiz` | Delete quiz |
| GET | `/videos/{id}/quiz/results` | Get quiz results |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Get unread count |
| POST | `/notifications` | Send notification |
| POST | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/send-to-teachers` | Send to all teachers |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/attendance` | Attendance report |
| GET | `/reports/teachers` | Teachers report |
| GET | `/reports/monthly` | Monthly report |
| GET | `/reports/export-pdf` | Export report as PDF |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments` | Record payment |

### Subscription

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscription` | Get subscription details |
| POST | `/subscription/renew` | Request renewal |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Get leaderboard |

### Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/permissions` | List all permissions |

---

## Teacher Endpoints

Base path: `/api/v1/teacher`

**Middleware:** `auth:sanctum`, `EnsureUserNotSuspended:teacher`, `EnsureActiveSubscription`

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard statistics |
| GET | `/dashboard/students` | Get recent students |
| GET | `/dashboard/lectures` | Get upcoming lectures |
| GET | `/dashboard/academies` | Get teacher academies |

### Students Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students` | List students |
| GET | `/students/{id}` | Get student details |
| POST | `/students` | Create student |
| PUT | `/students/{id}` | Update student |
| DELETE | `/students/{id}` | Delete student |
| GET | `/students/statistics` | Student statistics |
| GET | `/students/search-phone` | Search by phone |
| PUT | `/students/{id}/permissions` | Update permissions |
| PUT | `/students/{id}/toggle-status` | Toggle status |
| GET | `/students/{id}/activation-details` | Activation details |
| PUT | `/students/{id}/activate` | Activate student |
| POST | `/students/{id}/payments` | Record payment |

### Lectures

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lectures` | List lectures |
| GET | `/lectures/{id}` | Get lecture details |
| POST | `/lectures` | Create lecture |
| PUT | `/lectures/{id}` | Update lecture |
| DELETE | `/lectures/{id}` | Delete lecture |
| PUT | `/lectures/{id}/toggle-active` | Toggle active |
| POST | `/lectures/{id}/end` | End lecture |
| POST | `/lectures/{id}/cancel-session` | Cancel session |
| GET | `/lectures/{id}/attendees` | Get attendees |
| GET | `/lectures/{id}/attendees/export` | Export attendees |
| GET | `/lectures/{id}/sessions` | Get sessions |
| POST | `/lectures/{id}/sessions` | Create session |

### QR Code Scanning

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan/checkin` | Check-in via QR |
| POST | `/scan/checkout` | Check-out via QR |
| GET | `/scan/today-status` | Today's scan status |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments` | List payments |
| GET | `/payments/pending` | Get pending payments |
| GET | `/payments/statistics` | Payment statistics |
| GET | `/payments/{id}` | Get payment details |
| POST | `/payments` | Create payment |
| POST | `/payments/sync` | Sync batch payments |
| POST | `/payments/{id}/cancel` | Cancel payment |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/voice-limit` | Check voice limit |
| POST | `/notifications` | Send notification |
| POST | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/voice` | Send voice notification |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Get leaderboard |
| GET | `/gamification/settings` | Get settings |
| PUT | `/gamification/settings` | Update settings |
| POST | `/gamification/bonus` | Award bonus points |
| GET | `/students/{id}/points` | Get student points |

### Videos

Same endpoints as Academy videos, plus:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos/{id}/stream` | Stream video |
| GET | `/videos/{id}/stream-url` | Get stream URL |
| GET | `/videos/{id}/thumbnail` | Get thumbnail |
| GET | `/videos/{id}/thumbnail-url` | Get thumbnail URL |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/my-report` | Get teacher report |
| GET | `/reports/my-report/pdf` | Export report as PDF |

### Sync Errors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sync-errors` | List sync errors |
| GET | `/sync-errors/count` | Unresolved count |
| GET | `/sync-errors/{id}` | Get error details |
| POST | `/sync-errors/{id}/resolve` | Resolve error |
| POST | `/sync-errors/bulk-resolve` | Bulk resolve |

### Secretary Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/secretaries` | List secretaries |
| POST | `/secretaries` | Create secretary |
| PUT | `/secretaries/{id}` | Update secretary |
| DELETE | `/secretaries/{id}` | Delete secretary |
| POST | `/secretaries/check-phone` | Check phone |
| PUT | `/secretaries/{id}/permissions` | Update permissions |
| PUT | `/secretaries/{id}/toggle-status` | Toggle status |

---

## Student Endpoints

Base path: `/api/v1/student`

**Middleware:** `auth:sanctum`, `EnsureTeacherNotSuspended`

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get profile |
| POST | `/logout` | Logout |
| POST | `/change-password` | Change password |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard |
| GET | `/teachers` | List available teachers |
| GET | `/teachers/{id}/dashboard` | Teacher dashboard |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attend` | Mark attendance (QR) |
| GET | `/attendance` | Attendance history |

### Lectures

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lectures` | List lectures |

### Exams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams` | List available exams |
| GET | `/exams/{id}` | Get exam details |
| POST | `/exams/{id}/start` | Start exam |
| POST | `/exams/attempts/{id}/answer` | Submit answer |
| POST | `/exams/attempts/{id}/skip` | Skip question |
| POST | `/exams/attempts/{id}/terminate` | End exam |
| GET | `/exams/attempts/{id}/status` | Attempt status |
| GET | `/exams/{id}/result` | Get exam result |

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos` | List videos |
| GET | `/videos/{id}` | Get video details |
| POST | `/videos/{id}/playback-token` | Get playback token |
| GET | `/videos/{id}/stream-url` | Get stream URL |
| GET | `/videos/{id}/thumbnail` | Get thumbnail |
| GET | `/videos/{id}/attachments/{attachmentId}` | Download attachment |
| GET | `/videos/{id}/attachments/{attachmentId}/view-url` | Get attachment URL |
| POST | `/videos/{id}/progress` | Update progress |
| POST | `/videos/{id}/like` | Toggle like |

### Video Quiz

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos/{id}/quiz` | Get quiz |
| POST | `/videos/{id}/quiz/submit` | Submit quiz |
| GET | `/videos/{id}/quiz/attempts` | Get attempts |

### Gamification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/points` | Get all points |
| GET | `/points/{teacherId}` | Get points for teacher |
| GET | `/points/{teacherId}/history` | Points history |
| GET | `/leaderboard/{teacherId}` | Get leaderboard |

### Mistakes Notebook

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mistakes` | List mistakes |
| POST | `/mistakes/{id}/mastered` | Mark as mastered |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| POST | `/notifications` | Create notification |
| POST | `/notifications/{id}/read` | Mark as read |

---

## Guardian (Parent) Endpoints

Base path: `/api/v1/parent`

**Middleware:** `auth:sanctum`

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get profile |
| PUT | `/profile` | Update profile |
| POST | `/logout` | Logout |
| POST | `/change-password` | Change password |

### Children

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/children` | List children |
| GET | `/children/{id}/summary` | Child summary |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| POST | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/mark-all-read` | Mark all read |

### Device Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/device-tokens` | Register FCM token |

---

## Secretary Endpoints

Base path: `/api/v1/secretary`

**Middleware:** `auth:sanctum`

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get profile |
| POST | `/logout` | Logout |
| POST | `/change-password` | Change password |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| POST | `/notifications` | Send notification |
| POST | `/notifications/{id}/read` | Mark as read |

---

## Shared Endpoints

### Avatar Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/avatar` | Yes | Get avatar |
| POST | `/api/v1/avatar/upload` | Yes | Upload avatar |
| DELETE | `/api/v1/avatar` | Yes | Delete avatar |

### Broadcasting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/broadcasting/auth` | Yes | WebSocket authentication |

### Media Proxy

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/media/{path}` | Yes | Proxy media files |
| GET | `/api/v1/media/voice/{path}` | Yes | Proxy voice files |

### Public Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/public-settings` | No | Get public settings |

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (business logic error) |
| 422 | Validation Error |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

## Error Codes

Common error codes returned in the `code` field:

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `SUBSCRIPTION_EXPIRED` | Subscription has expired |
| `TEACHER_SUSPENDED` | Teacher account suspended |
| `RATE_LIMITED` | Too many requests |
| `EXAM_ALREADY_COMPLETED` | Exam already taken |
| `ENROLLMENT_REQUIRED` | Student not enrolled |

## References

- [Authentication Documentation](./auth.md)
- [Error Handling](./errors.md)
- [Request Lifecycle](./request-lifecycle.md)

## TODO

- [ ] Add request/response examples for each endpoint
- [ ] Add OpenAPI/Swagger specification
- [ ] Document query parameters for list endpoints
- [ ] Add webhook documentation
