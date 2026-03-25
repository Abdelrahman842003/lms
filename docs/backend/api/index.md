---
title: API Reference Overview
description: Complete API reference for the Neetaq Educational Platform
---

# API Reference Overview

The Neetaq Platform provides a RESTful API for all client applications. All API endpoints are versioned and prefixed with `/api/v1/`.

## Base URL

```
Production: https://api.neetaq.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

The API uses Laravel Sanctum for token-based authentication. Most endpoints require authentication via Bearer token.

```http
Authorization: Bearer {token}
```

Tokens can be obtained through the login endpoints for each user type.

## API Structure by User Role

| Role | Prefix | Description |
|------|--------|-------------|
| Teacher | `/api/v1/teacher/*` | Teacher portal endpoints |
| Student | `/api/v1/student/*` | Student portal endpoints |
| Academy | `/api/v1/academy/*` | Academy management endpoints |
| Guardian | `/api/v1/guardian/*` | Parent/Guardian portal endpoints |
| Secretary | `/api/v1/secretary/*` | Secretary portal endpoints |

## Common Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/login/teacher` | Teacher login |
| POST | `/api/v1/login/student` | Student login |
| POST | `/api/v1/login/academy` | Academy login |
| POST | `/api/v1/login/guardian` | Guardian login |
| POST | `/api/v1/login/secretary` | Secretary login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout current session |

### Shared Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public-settings` | Get public platform settings |
| POST | `/api/v1/avatar/upload` | Upload user avatar |
| GET | `/api/v1/media/{path}` | Proxy media files from R2 |

## Rate Limiting

The API implements rate limiting on various endpoints:

| Throttle Key | Limit | Endpoints |
|--------------|-------|-----------|
| `auth` | 5/minute | Login endpoints |
| `register` | 3/minute | Registration |
| `token-refresh` | 10/minute | Token refresh |
| `notifications` | 30/minute | Notification sending |
| `voice-notifications` | 10/minute | Voice notifications |
| `video-upload` | 10/minute | Video uploads |
| `video-stream` | 100/minute | Video streaming |
| `attendance` | 60/minute | Attendance scanning |
| `payments` | 30/minute | Payment operations |

## Request/Response Format

### Request Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
X-Academy-Id: {academy_id}  # Optional, for multi-tenant context
```

### Success Response

```json
{
  "status": true,
  "status_code": 200,
  "message": "تمت العملية بنجاح",
  "data": { ... }
}
```

### Error Response

```json
{
  "status": false,
  "status_code": 400,
  "message": "حدث خطأ",
  "errors": { ... }
}
```

### Paginated Response

```json
{
  "status": true,
  "status_code": 200,
  "message": "تم الجلب بنجاح",
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Server Error |

## References

- [`backend/routes/api.php`](https://github.com/neetaq/platform/blob/main/backend/routes/api.php)
- [`backend/app/Domains/Application/Traits/ApiResponseTrait.php`](https://github.com/neetaq/platform/blob/main/backend/app/Domains/Application/Traits/ApiResponseTrait.php)
