---
title: API Response Format
description: Standardized JSON response format used across all Neetaq API endpoints including success, error, and paginated responses
---

# API Response Format

All Neetaq API endpoints return a standardized JSON response structure implemented through the `ApiResponseTrait`. Every response includes a `status` boolean, `status_code` integer, and a `message` string.

## Overview

The response format is defined in `App\Domains\Application\Traits\ApiResponseTrait` and is used by all controllers across the platform. Responses are always JSON (`Content-Type: application/json`) and follow a consistent envelope pattern.

## Success Response

```json
{
  "status": true,
  "status_code": 200,
  "message": "تمت العملية بنجاح",
  "data": { }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | boolean | Always `true` for success |
| `status_code` | integer | HTTP status code (200, 201, 204) |
| `message` | string | Arabic success message |
| `data` | mixed | Response payload (object, array, or null) |

### Created (201)

```json
{
  "status": true,
  "status_code": 201,
  "message": "تم الإنشاء بنجاح",
  "data": {
    "id": 42,
    "name": "New Resource"
  }
}
```

### No Content (204)

Returned for successful deletions or actions with no response body:

```json
{
  "status": true,
  "status_code": 204,
  "message": "تمت العملية بنجاح"
}
```

## Error Response

```json
{
  "status": false,
  "status_code": 400,
  "message": "حدث خطأ",
  "errors": { },
  "data": null
}
```

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `status` | boolean | Yes | Always `false` for errors |
| `status_code` | integer | Yes | HTTP error code |
| `message` | string | Yes | Arabic error description |
| `errors` | mixed | No | Validation errors or error details |
| `data` | mixed | No | Additional context data |

### Validation Error (422)

```json
{
  "status": false,
  "status_code": 422,
  "message": "بيانات غير صالحة",
  "errors": {
    "phone": ["حقل الهاتف مطلوب"],
    "password": ["كلمة المرور يجب أن تكون 8 أحرف على الأقل"]
  }
}
```

### Unauthorized (401)

```json
{
  "status": false,
  "status_code": 401,
  "message": "غير مصرح بالدخول"
}
```

### Forbidden (403)

```json
{
  "status": false,
  "status_code": 403,
  "message": "ليس لديك الصلاحية"
}
```

### Not Found (404)

```json
{
  "status": false,
  "status_code": 404,
  "message": "العنصر غير موجود"
}
```

### Too Many Requests (429)

```json
{
  "status": false,
  "status_code": 429,
  "message": "تم تجاوز الحد المسموح به"
}
```

## Paginated Response

List endpoints return paginated results with `meta` and `links` objects:

```json
{
  "status": true,
  "status_code": 200,
  "message": "تم الجلب بنجاح",
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "https://api.neetaq.com/api/v1/teacher/students?page=1",
    "last": "https://api.neetaq.com/api/v1/teacher/students?page=10",
    "prev": null,
    "next": "https://api.neetaq.com/api/v1/teacher/students?page=2"
  }
}
```

### Meta Fields

| Field | Type | Description |
|-------|------|-------------|
| `current_page` | integer | Current page number (1-indexed) |
| `last_page` | integer | Total number of pages |
| `per_page` | integer | Items per page |
| `total` | integer | Total item count across all pages |
| `from` | integer/null | Item number of first item on current page |
| `to` | integer/null | Item number of last item on current page |

### Links Fields

| Field | Type | Description |
|-------|------|-------------|
| `first` | string | URL to first page |
| `last` | string | URL to last page |
| `prev` | string/null | URL to previous page, `null` if on first page |
| `next` | string/null | URL to next page, `null` if on last page |

### Pagination Query Parameters

Clients can control pagination via query string:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `per_page` | 15 | Items per page (server may enforce max) |

## Error Codes Reference

| Code | Name | When It Occurs |
|------|------|----------------|
| 400 | Bad Request | Malformed request, invalid parameters |
| 401 | Unauthorized | Missing or invalid token, wrong credentials |
| 403 | Forbidden | Authenticated but lacking permission (policy failure) |
| 404 | Not Found | Resource does not exist or belongs to another user |
| 409 | Conflict | Duplicate resource creation (e.g., already enrolled) |
| 422 | Validation Error | Request body fails validation rules |
| 429 | Too Many Requests | Rate limit exceeded (see [Rate Limiting](./rate-limiting)) |
| 500 | Server Error | Unexpected server-side failure |

## Response Helpers Reference

The `ApiResponseTrait` provides these helper methods to controllers:

| Method | Code | Use Case |
|--------|------|----------|
| `successResponse($data, $message, $code)` | 200 | General success |
| `created($data, $message)` | 201 | Resource creation |
| `noContent($message)` | 204 | Successful deletion |
| `errorResponse($message, $errors, $code, $data)` | varies | General error |
| `unauthorized($message)` | 401 | Authentication failure |
| `forbidden($message)` | 403 | Authorization failure |
| `notFound($message)` | 404 | Resource not found |
| `validationError($errors, $message)` | 422 | Validation failure |
| `tooManyRequests($message)` | 429 | Rate limit exceeded |
| `paginated($paginator, $resource, $message)` | 200 | Paginated list |

## Common Patterns

### Conditional Fields

The `errors` and `data` fields in error responses are only included when they have content. This keeps responses minimal:

```json
{
  "status": false,
  "status_code": 401,
  "message": "بيانات الدخول غير صحيحة - متبقي 3 محاولات"
}
```

### Resource Wrapping

Individual resources are wrapped in a `data` object when returned from `show` endpoints. Collections from `index` endpoints are returned as arrays within `data`. API Resources (e.g., `TeacherResource`) transform models before serialization.

### Null Data

For operations that do not return content (logout, deletion, settings update), `data` may be `null` or omitted entirely.

## References

- [ApiResponseTrait Source](https://github.com/neetaq/platform/blob/main/backend/app/Domains/Application/Traits/ApiResponseTrait.php)
- [API Reference Overview](./index.md)
- [Rate Limiting](./rate-limiting.md)
