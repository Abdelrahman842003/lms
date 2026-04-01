---
title: ApiResponseTrait
description: Standardized JSON API response helpers for the Neetaq platform
---

# ApiResponseTrait

The `ApiResponseTrait` provides a consistent interface for formatting JSON responses across all API controllers. Every response follows a uniform structure, making it easy for frontend clients to parse results.

## Methods

### `successResponse($data, string $message = 'Success', int $code = 200)`

Returns a successful JSON response with data.

```php
return $this->successResponse($student, 'Student retrieved successfully');
```

**Response:**

```json
{
    "success": true,
    "message": "Student retrieved successfully",
    "data": {
        "id": 1,
        "name": "Ahmed Mohamed",
        "email": "ahmed@example.com"
    }
}
```

### `created($data, string $message = 'Resource created')`

Returns a 201 Created response for newly created resources.

```php
return $this->created($exam, 'Exam created successfully');
```

**Response:**

```json
{
    "success": true,
    "message": "Exam created successfully",
    "data": {
        "id": 42,
        "title": "Midterm Exam",
        "status": "draft"
    }
}
```

### `errorResponse(string $message, int $code = 500, $errors = null, $data = null)`

Returns an error response with optional validation errors and supplementary data.

```php
return $this->errorResponse('Something went wrong', 500);
```

**Response:**

```json
{
    "success": false,
    "message": "Something went wrong",
    "errors": null,
    "data": null
}
```

### `unauthorized(string $message = 'Unauthorized')`

Returns a 401 Unauthorized response.

```php
return $this->unauthorized('Invalid credentials');
```

**Response:**

```json
{
    "success": false,
    "message": "Invalid credentials"
}
```

### `forbidden(string $message = 'Forbidden')`

Returns a 403 Forbidden response.

```php
return $this->forbidden('You do not own this resource');
```

**Response:**

```json
{
    "success": false,
    "message": "You do not own this resource"
}
```

### `notFound(string $message = 'Resource not found')`

Returns a 404 Not Found response.

```php
return $this->notFound('Exam not found');
```

**Response:**

```json
{
    "success": false,
    "message": "Exam not found"
}
```

### `validationError($errors)`

Returns a 422 Unprocessable Entity response with validation error details.

```php
return $this->validationError($validator->errors());
```

**Response:**

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

### `tooManyRequests(int $retryAfter = 60)`

Returns a 429 Too Many Requests response with a retry-after hint.

```php
return $this->tooManyRequests(120);
```

**Response:**

```json
{
    "success": false,
    "message": "Too many requests. Please try again later.",
    "data": {
        "retry_after": 120
    }
}
```

### `paginated($data, $paginator)`

Returns a paginated response with metadata.

```php
return $this->paginated($students, $paginator);
```

**Response:**

```json
{
    "success": true,
    "message": "Success",
    "data": [
        {"id": 1, "name": "Ahmed"},
        {"id": 2, "name": "Sara"}
    ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 15,
        "total": 72,
        "from": 1,
        "to": 15
    }
}
```

### `noContent()`

Returns a 204 No Content response for successful operations with no body.

```php
return $this->noContent();
```

**Response:** HTTP 204 with empty body.

## Response Format Summary

| Method | HTTP Status | `success` | Has `data` | Has `errors` |
|--------|-------------|-----------|------------|--------------|
| `successResponse` | 200 | `true` | Yes | No |
| `created` | 201 | `true` | Yes | No |
| `errorResponse` | 4xx/5xx | `false` | Optional | Optional |
| `unauthorized` | 401 | `false` | No | No |
| `forbidden` | 403 | `false` | No | No |
| `notFound` | 404 | `false` | No | No |
| `validationError` | 422 | `false` | No | Yes |
| `tooManyRequests` | 429 | `false` | Yes | No |
| `paginated` | 200 | `true` | Yes | No |
| `noContent` | 204 | - | No | No |

## See Also

- [Traits Reference](./index) - All available traits
- [Errors](../errors) - Error handling documentation
