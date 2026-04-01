---
title: API Rate Limiting
description: Rate limiting configuration, throttle policies, and per-role limits for the Neetaq API
---

# API Rate Limiting

The Neetaq API implements granular rate limiting using Laravel's `RateLimiter` facade. Different throttle policies apply to different endpoint categories to protect against abuse while maintaining usability.

## Overview

Rate limiting is configured in `AppServiceProvider::configureRateLimiting()` and applied via the `throttle` middleware on route definitions. When a rate limit is exceeded, the API returns a `429 Too Many Requests` response.

## Throttle Policies

| Throttle Key | Limit | Scope | Applied To |
|--------------|-------|-------|------------|
| `api` | 60/min | Per user or IP | General API routes (default) |
| `auth` | 5/min per email + 10/min per IP | Dual: per credential + per IP | Login endpoints (all roles) |
| `login` | 10/min | Per IP | Legacy login limiter |
| `register` | 5/min | Per IP | Teacher registration |
| `password-reset` | 3/min | Per email or IP | Password reset requests |
| `token-refresh` | 10/min | Per user or IP | Token refresh |
| `payments` | 10/min | Per user or IP | Payment creation, sync, cancellation |
| `notifications` | 30/min | Per user or IP | Notification creation, mark-as-read |
| `voice-notifications` | 10/min | Per user or IP | Voice notification sending |
| `video-upload` | 6/min | Per user+IP | Video upload initiation |
| `video-stream` | 120/min | Per user or IP | Video streaming endpoints |
| `video-playback` | 30/min | Per user+IP | Playback token generation, stream URL |
| `uploads` | 10/min | Per user or IP | General file uploads, attachments |
| `avatar-upload` | 5/min | Per user or IP | Profile avatar upload |
| `exam-submit` | 30/min | Per user or IP | Exam answer submission, skip |
| `attendance` | 20/min | Per user or IP | Attendance marking, QR checkin/checkout |

## Rate-Limited Endpoints by Role

### Teacher

| Endpoint | Throttle Key |
|----------|--------------|
| `POST /login/teacher` | `auth` |
| `POST /register/teacher` | `register` |
| `POST /teacher/notifications` | `notifications` |
| `POST /teacher/notifications/{id}/read` | `notifications` |
| `POST /teacher/notifications/voice` | `voice-notifications` |
| `POST /teacher/payments` | `payments` |
| `POST /teacher/payments/sync` | `payments` |
| `POST /teacher/payments/{payment}/cancel` | `payments` |
| `POST /teacher/students/{student}/payments` | `payments` |
| `POST /teacher/subscription/renew` | `payments` |
| `POST /teacher/scan/checkin` | `attendance` |
| `POST /teacher/scan/checkout` | `attendance` |
| `POST /teacher/videos/initiate-upload` | `video-upload` |
| `POST /teacher/videos/{video}/attachments` | `uploads` |
| `GET /teacher/videos/{video}/stream` | `video-stream` |
| `GET /teacher/videos/{video}/stream-url` | `video-stream` |

### Student

| Endpoint | Throttle Key |
|----------|--------------|
| `POST /login/student` | `auth` |
| `POST /student/attend` | `attendance` |
| `POST /student/exams/attempts/{attempt}/answer` | `exam-submit` |
| `POST /student/exams/attempts/{attempt}/skip` | `exam-submit` |
| `POST /student/notifications` | `notifications` |
| `POST /student/notifications/{id}/read` | `notifications` |
| `POST /student/videos/{video}/playback-token` | `video-playback` |
| `GET /student/videos/{video}/stream-url` | `video-playback` |

### Academy

| Endpoint | Throttle Key |
|----------|--------------|
| `POST /academy/login` | `auth` |
| `POST /academy/notifications` | `notifications` |
| `POST /academy/notifications/{id}/read` | `notifications` |
| `POST /academy/notifications/send-to-teachers` | `notifications` |
| `POST /academy/payments` | `payments` |
| `POST /academy/subscription/renew` | `payments` |
| `POST /academy/videos/initiate-upload` | `video-upload` |

### Guardian

| Endpoint | Throttle Key |
|----------|--------------|
| `POST /login/parent` | `auth` |
| `POST /parent/notifications/{id}/read` | `notifications` |
| `POST /parent/notifications/mark-all-read` | `notifications` |
| `POST /parent/device-tokens` | `uploads` |

### Secretary

| Endpoint | Throttle Key |
|----------|--------------|
| `POST /login/secretary` | `auth` |
| `POST /secretary/notifications` | `notifications` |
| `POST /secretary/notifications/{id}/read` | `notifications` |

## Response When Rate Limited

When a rate limit is exceeded, the API returns:

```json
{
  "status": false,
  "status_code": 429,
  "message": "تم تجاوز الحد المسموح به"
}
```

### Custom Headers

The Laravel throttle middleware includes standard rate-limit headers in every response:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the current window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `Retry-After` | Seconds until the rate limit resets (only present on 429 responses) |

### Example Response Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
Content-Type: application/json
```

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
Content-Type: application/json
```

## Per-Role Limit Summary

| Role | Most Restricted Endpoint | Limit |
|------|-------------------------|-------|
| Teacher | Video upload initiation | 6/min |
| Teacher | Voice notifications | 10/min |
| Teacher | Payments | 10/min |
| Student | Exam answer submission | 30/min |
| Student | Video playback tokens | 30/min |
| Student | Attendance marking | 20/min |
| Academy | Video upload initiation | 6/min |
| Academy | Payments | 10/min |
| Academy | Notifications | 30/min |
| Guardian | Notification read | 30/min |
| Guardian | Device token registration | 10/min |
| Secretary | Notification sending | 30/min |

## Common Patterns

### Login Throttling

Login endpoints use the `auth` throttle which applies **two concurrent limits**:

1. **5 attempts per minute per email/phone** -- protects individual accounts from targeted brute-force
2. **10 attempts per minute per IP** -- protects against distributed attacks from a single source

Both limits must pass for the request to succeed. Failed login attempts are tracked by `LoginAttemptService` and remaining attempts are returned in the error response.

### Dual-Key Rate Limiting

Some throttle policies (like `video-upload` and `video-playback`) use a composite key of `user_id + ip`:

```php
Limit::perMinute(6)->by(($request->user()?->id ?? 'guest') . '|' . $request->ip());
```

This prevents a single user from exceeding limits across multiple IPs, while also rate-limiting unauthenticated requests per IP.

### Retry Strategy

Clients should implement exponential backoff when receiving `429` responses:

1. Read the `Retry-After` header value
2. Wait the specified number of seconds
3. Retry the request
4. If `429` again, double the wait time (capped at 60 seconds)

## References

- [AppServiceProvider (Rate Limiting Configuration)](https://github.com/neetaq/platform/blob/main/backend/app/Providers/AppServiceProvider.php)
- [Teacher Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/teacher.php)
- [Student Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/student.php)
- [Academy Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/academy.php)
- [Guardian Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/guardian.php)
- [Secretary Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/secretary.php)
- [Laravel Rate Limiting Documentation](https://laravel.com/docs/rate-limiting)
