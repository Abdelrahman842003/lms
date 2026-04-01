---
title: Guardian API
description: Complete reference for guardian (parent) facing API endpoints
---

# Guardian API

**Base Path:** `/api/v1/parent`

All guardian endpoints require `auth:sanctum` middleware. Guardian routes currently do not have suspension middleware.

## Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/login/parent` | Login (phone + password) | No |
| POST | `/parent/logout` | Logout | Yes |
| GET | `/parent/me` | Get current profile | Yes |
| PUT | `/parent/profile` | Update profile | Yes |
| POST | `/parent/change-password` | Change password | Yes |

### Login Guardian

```http
POST /api/v1/login/parent
Content-Type: application/json

{
  "phone": "201234567890",
  "password": "secret123"
}
```

**Rate Limit:** `throttle:auth`

---

## Children

| Method | Path | Description |
|--------|------|-------------|
| GET | `/parent/children` | List linked children (students) |
| GET | `/parent/children/{studentId}/summary` | Child summary report |

### Child Summary

Returns aggregated data about a child's performance including:
- Attendance rate
- Recent exam scores
- Upcoming lectures
- Gamification points

```http
GET /parent/children/{studentId}/summary
```

---

## Notifications

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/parent/notifications` | List notifications | - |
| POST | `/parent/notifications/{id}/read` | Mark as read | `notifications` |
| POST | `/parent/notifications/mark-all-read` | Mark all as read | `notifications` |

---

## Device Tokens

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/parent/device-tokens` | Register FCM token | `uploads` |

### Register Device Token

```http
POST /parent/device-tokens
Content-Type: application/json

{
  "token": "fcm_device_token_string",
  "device_type": "android"
}
```

Used for push notifications via Firebase Cloud Messaging.

---

## References

- [Authentication](/backend/api/authentication) - Login flow
- [Response Format](/backend/api/response-format) - Standard response structure
- [Auth Domain](/backend/domains/auth) - Guardian model
- [Notifications Domain](/backend/domains/notifications) - Notification system
