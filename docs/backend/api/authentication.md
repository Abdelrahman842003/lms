---
title: API Authentication
description: Authentication endpoints for all Neetaq user types including login, logout, profile, and token lifecycle
---

# API Authentication

The Neetaq platform uses Laravel Sanctum for token-based authentication. Each user role has dedicated login and session management endpoints.

## Overview

All user types authenticate through role-specific endpoints. On successful login, the server returns an access token (and optionally a refresh token) that must be included in subsequent requests via the `Authorization` header.

## Login Endpoints

| Method | Path | Controller | Middleware | Rate Limited |
|--------|------|------------|------------|--------------|
| POST | `/api/v1/login/teacher` | `Teacher\AuthController@login` | `throttle:auth`, `auth.cookies` | Yes |
| POST | `/api/v1/login/student` | `Student\AuthController@login` | `throttle:auth`, `auth.cookies` | Yes |
| POST | `/api/v1/academy/login` | `Academy\AuthController@login` | `throttle:auth`, `auth.cookies` | Yes |
| POST | `/api/v1/login/parent` | `Guardian\AuthController@login` | `throttle:auth`, `auth.cookies` | Yes |
| POST | `/api/v1/login/secretary` | `Secretary\AuthController@login` | `throttle:auth`, `auth.cookies` | Yes |

### Auth Throttle Limits

The `throttle:auth` limiter applies two concurrent limits:

- **5 requests per minute per email/phone** -- prevents brute-force attacks against a single account
- **10 requests per minute per IP** -- prevents distributed brute-force from one source

### Request Body

```json
{
  "phone": "+201012345678",
  "password": "secret123",
  "device_token": "fcm-device-token-here",
  "device_type": "android",
  "remember": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | User phone number in international format |
| `password` | string | Yes | Account password |
| `device_token` | string | No | FCM token for push notifications |
| `device_type` | string | No | Device platform: `android`, `ios` |
| `remember` | boolean | No | Extend token lifetime |

### Success Response

```json
{
  "status": true,
  "status_code": 200,
  "message": "تمت العملية بنجاح",
  "data": {
    "token": "1|abc123...",
    "refresh_token": "2|def456...",
    "user": {
      "id": 1,
      "name": "Ahmed Mohamed",
      "phone": "+201012345678",
      "role": "teacher"
    },
    "role": "teacher",
    "device_removed": false
  }
}
```

### Failed Login Response

```json
{
  "status": false,
  "status_code": 401,
  "message": "بيانات الدخول غير صحيحة - متبقي 4 محاولات",
  "data": {
    "attempts_remaining": 4
  }
}
```

## Session Endpoints

All authenticated routes are protected by `auth:sanctum` middleware. The following session management endpoints exist per role:

### Teacher

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/teacher/logout` | Revoke current token and FCM token | `auth:sanctum` |
| GET | `/api/v1/teacher/me` | Get authenticated teacher profile (with academies) | `auth:sanctum` |
| PUT | `/api/v1/teacher/profile` | Update teacher profile | `auth:sanctum` |
| POST | `/api/v1/teacher/change-password` | Change password (requires `current_password`) | `auth:sanctum` |

### Student

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/student/logout` | Revoke current token and FCM token | `auth:sanctum` |
| GET | `/api/v1/student/me` | Get authenticated student profile | `auth:sanctum` |
| POST | `/api/v1/student/change-password` | Change password | `auth:sanctum` |
| GET | `/api/v1/student/teachers` | List student's teachers | `auth:sanctum` |
| GET | `/api/v1/student/teachers/{teacher}/dashboard` | Get teacher-specific dashboard | `auth:sanctum` |

### Academy

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/academy/logout` | Revoke current token | `auth:sanctum` |
| GET | `/api/v1/academy/me` | Get authenticated academy profile | `auth:sanctum` |
| PUT | `/api/v1/academy/profile` | Update academy profile | `auth:sanctum` |
| POST | `/api/v1/academy/change-password` | Change password | `auth:sanctum` |

### Guardian

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/parent/logout` | Revoke current token | `auth:sanctum` |
| GET | `/api/v1/parent/me` | Get authenticated guardian profile | `auth:sanctum` |
| PUT | `/api/v1/parent/profile` | Update guardian profile | `auth:sanctum` |
| POST | `/api/v1/parent/change-password` | Change password | `auth:sanctum` |
| GET | `/api/v1/parent/children` | List linked children | `auth:sanctum` |

### Secretary

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/secretary/logout` | Revoke current token | `auth:sanctum` |
| GET | `/api/v1/secretary/me` | Get authenticated secretary profile | `auth:sanctum` |
| POST | `/api/v1/secretary/change-password` | Change password | `auth:sanctum` |

### Admin

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/reports` | Admin report index | `auth:admin` |
| GET | `/api/v1/admin/reports/drilldown/{key}` | Drilldown into report | `auth:admin` |
| GET | `/api/v1/admin/reports/export` | Export report data | `auth:admin` |

## Logout Request

```json
{
  "fcm_token": "optional-fcm-token-to-remove"
}
```

Providing `fcm_token` on logout removes the device's push notification registration.

## Token Lifecycle

```
Login  -->  Access Token (short-lived)  -->  Auto-expiry
                 |
                 +-->  Refresh Token (long-lived)  -->  Obtain new access token
```

- **Access tokens** are short-lived Sanctum tokens used for API authentication.
- **Refresh tokens** allow obtaining a new access token without re-authentication.
- Device limits are enforced -- if a user exceeds the maximum number of registered devices, the oldest device session is automatically revoked (`device_removed: true` in login response).
- Failed login attempts are tracked per phone and IP, with remaining attempts returned in error responses.

## Cookie-Based Sessions

All login endpoints use the `auth.cookies` middleware, which sets Sanctum's SPA authentication cookies for web-based clients. Mobile and API clients should use the Bearer token from the response body instead.

## Middleware Stack per Role

| Role | Auth Guard | Suspension Check | Subscription Check |
|------|------------|------------------|--------------------|
| Teacher | `auth:sanctum` | `EnsureUserNotSuspended:teacher` | `EnsureActiveSubscription` |
| Student | `auth:sanctum` | `EnsureTeacherNotSuspendedForStudent` | -- |
| Academy | `auth:sanctum` | -- | `EnsureActiveSubscription` |
| Guardian | `auth:sanctum` | -- (not yet implemented) | -- |
| Secretary | `auth:sanctum` | -- (not yet implemented) | -- |
| Admin | `auth:admin` | -- | -- |

## Registration

| Method | Path | Description | Rate Limited |
|--------|------|-------------|--------------|
| POST | `/api/v1/register/teacher` | Register a new teacher account | `throttle:register` (5/min/IP) |

## Common Patterns

### Authorization Header

All authenticated requests must include:

```http
Authorization: Bearer 1|abc123...
Accept: application/json
Content-Type: application/json
```

### Change Password

All roles support password changes via the same pattern:

```json
{
  "current_password": "old-secret",
  "new_password": "new-secret",
  "new_password_confirmation": "new-secret"
}
```

Response:

```json
{
  "status": true,
  "status_code": 200,
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

## References

- [Teacher Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/teacher.php)
- [Student Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/student.php)
- [Academy Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/academy.php)
- [Guardian Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/guardian.php)
- [Secretary Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/secretary.php)
- [Admin Routes](https://github.com/neetaq/platform/blob/main/backend/routes/api/v1/admin.php)
- [AuthController (Teacher)](https://github.com/neetaq/platform/blob/main/backend/app/Domains/Application/Http/Controllers/Teacher/AuthController.php)
- [TokenService](https://github.com/neetaq/platform/blob/main/backend/app/Domains/Auth/Services/TokenService.php)
- [DeviceLimitService](https://github.com/neetaq/platform/blob/main/backend/app/Domains/Auth/Services/DeviceLimitService.php)
- [LoginAttemptService](https://github.com/neetaq/platform/blob/main/backend/app/Domains/Auth/Services/LoginAttemptService.php)
