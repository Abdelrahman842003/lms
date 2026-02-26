---
title: Error Handling
description: Global error format, error codes, and exception handling
---

# Error Handling

The Neetaq platform uses a consistent error handling strategy across all API endpoints.

## Error Response Format

All errors follow a standardized JSON structure:

```json
{
  "status": false,
  "status_code": 400,
  "message": "Human-readable error message",
  "errors": {
    "field_name": ["Error detail 1", "Error detail 2"]
  },
  "data": {
    "attempts_remaining": 3,
    "retry_after": 60
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `status` | boolean | Always `false` for errors |
| `status_code` | integer | HTTP status code |
| `message` | string | Human-readable description |
| `errors` | object | Validation errors by field |
| `data` | object | Additional context data |

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 400 | Bad Request | Invalid request format, missing parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate, state mismatch) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Maintenance or overload |

## ApiResponseTrait

All controllers use `ApiResponseTrait` for consistent responses:

```php
<?php
namespace App\Domains\Support\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Success Response
     */
    protected function successResponse(
        $data = null,
        $message = 'Success',
        $code = 200
    ): JsonResponse {
        return response()->json([
            'status' => true,
            'status_code' => $code,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Error Response
     */
    protected function errorResponse(
        $message = 'Error',
        $code = 400,
        $errors = null,
        $data = null
    ): JsonResponse {
        $response = [
            'status' => false,
            'status_code' => $code,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }
}
```

## Common Error Scenarios

### Validation Errors (422)

```php
<?php
// Controller
public function store(StoreStudentRequest $request): JsonResponse
{
    // Validation happens automatically
    $validated = $request->validated();
    // ...
}

// Error Response
{
  "status": false,
  "status_code": 422,
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required."],
    "phone": [
      "The phone field is required.",
      "The phone must be a valid Egyptian number."
    ],
    "email": ["The email has already been taken."]
  }
}
```

### Authentication Errors (401)

```php
<?php
// Invalid credentials
{
  "status": false,
  "status_code": 401,
  "message": "Invalid credentials",
  "data": {
    "attempts_remaining": 3
  }
}

// Token expired
{
  "status": false,
  "status_code": 401,
  "message": "Token has expired",
  "data": {
    "token_expired": true
  }
}

// Missing token
{
  "status": false,
  "status_code": 401,
  "message": "Unauthenticated"
}
```

### Authorization Errors (403)

```php
<?php
// Insufficient permissions
{
  "status": false,
  "status_code": 403,
  "message": "You do not have permission to perform this action",
  "data": {
    "required_permission": "student.create",
    "user_roles": ["teacher"]
  }
}

// Account suspended
{
  "status": false,
  "status_code": 403,
  "message": "Your account has been suspended",
  "code": "ACCOUNT_SUSPENDED",
  "data": {
    "suspended_at": "2025-01-15T10:00:00Z",
    "reason": "Payment overdue"
  }
}

// Academy access denied
{
  "status": false,
  "status_code": 403,
  "message": "Unauthorized for this academy",
  "code": "INVALID_ACADEMY_CONTEXT"
}
```

### Not Found Errors (404)

```php
<?php
// Resource not found
{
  "status": false,
  "status_code": 404,
  "message": "Student not found",
  "data": {
    "resource": "student",
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}

// Route not found
{
  "status": false,
  "status_code": 404,
  "message": "The requested resource was not found"
}
```

### Rate Limiting Errors (429)

```php
<?php
{
  "status": false,
  "status_code": 429,
  "message": "Too many login attempts",
  "data": {
    "retry_after": 60,
    "attempts_remaining": 0
  }
}
```

### Business Logic Errors (400/409)

```php
<?php
// Exam already started
{
  "status": false,
  "status_code": 409,
  "message": "You already have an active attempt for this exam",
  "code": "ACTIVE_ATTEMPT_EXISTS",
  "data": {
    "attempt_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}

// Subscription quota exceeded
{
  "status": false,
  "status_code": 400,
  "message": "Student quota exceeded for current subscription plan",
  "code": "QUOTA_EXCEEDED",
  "data": {
    "current_count": 150,
    "max_allowed": 100,
    "plan": "basic"
  }
}

// Lecture not active
{
  "status": false,
  "status_code": 400,
  "message": "Lecture is not currently active",
  "code": "LECTURE_INACTIVE",
  "data": {
    "lecture_status": "scheduled",
    "starts_at": "2025-01-20T10:00:00Z"
  }
}
```

## Custom Exceptions

### Exception Classes

```php
<?php
namespace App\Domains\Exams\Exceptions;

use Exception;

class ExamNotFoundException extends Exception
{
    protected $code = 404;
    protected $message = 'Exam not found';
    
    public function __construct(string $examId)
    {
        parent::__construct("Exam with ID {$examId} not found");
    }
}

// Usage
throw new ExamNotFoundException($examId);
```

### Subscription Exceptions

```php
<?php
namespace App\Domains\Subscriptions\Exceptions;

class QuotaExceededException extends Exception
{
    protected $code = 400;
    
    public function __construct(
        string $resource,
        int $current,
        int $limit
    ) {
        parent::__construct(
            "{$resource} quota exceeded ({$current}/{$limit})"
        );
    }
}
```

## Exception Handler

```php
<?php
// bootstrap/app.php
->withExceptions(function (Exceptions $exceptions) {
    // Custom renderers
    $exceptions->render(function (ExamNotFoundException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'status' => false,
                'status_code' => 404,
                'message' => $e->getMessage(),
            ], 404);
        }
    });
    
    // Default API exception handler
    $exceptions->render(function (Throwable $e, Request $request) {
        if ($request->is('api/*')) {
            $code = $e instanceof HttpException 
                ? $e->getStatusCode() 
                : 500;
            
            $response = [
                'status' => false,
                'status_code' => $code,
                'message' => $e->getMessage(),
            ];
            
            if (config('app.debug')) {
                $response['debug'] = [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTrace(),
                ];
            }
            
            return response()->json($response, $code);
        }
    });
})
```

## Error Codes Reference

### Authentication Errors

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Wrong username/password |
| `TOKEN_EXPIRED` | Authentication token expired |
| `TOKEN_INVALID` | Malformed or invalid token |
| `ACCOUNT_SUSPENDED` | User account suspended |
| `ACCOUNT_INACTIVE` | User account not activated |
| `DEVICE_LIMIT_REACHED` | Max devices exceeded |

### Authorization Errors

| Code | Description |
|------|-------------|
| `INSUFFICIENT_PERMISSIONS` | Missing required permission |
| `INVALID_ACADEMY_CONTEXT` | User not in requested academy |
| `TEACHER_SUSPENDED` | Teacher account suspended |
| `SECRETARY_RESTRICTED` | Secretary lacks permission |

### Business Logic Errors

| Code | Description |
|------|-------------|
| `QUOTA_EXCEEDED` | Subscription limit reached |
| `ACTIVE_ATTEMPT_EXISTS` | Already have active exam attempt |
| `EXAM_NOT_STARTED` | Exam hasn't started yet |
| `EXAM_ENDED` | Exam already ended |
| `LECTURE_INACTIVE` | Lecture not currently active |
| `ATTENDANCE_CLOSED` | Attendance window closed |
| `PAYMENT_REQUIRED` | Subscription payment overdue |

### Resource Errors

| Code | Description |
|------|-------------|
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RESOURCE_CONFLICT` | Resource state conflict |
| `RESOURCE_DELETED` | Resource was soft-deleted |
| `RELATIONSHIP_VIOLATION` | Foreign key constraint failed |

## Frontend Error Handling

```typescript
// apiClient.ts - Error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    switch (response?.status) {
      case 401:
        // Token expired - refresh or redirect to login
        if (response.data?.data?.token_expired) {
          return refreshTokenAndRetry(error.config);
        }
        redirectToLogin();
        break;
        
      case 403:
        // Show permission denied message
        showToast(response.data.message, 'error');
        break;
        
      case 422:
        // Show validation errors
        const errors = response.data.errors;
        showValidationErrors(errors);
        break;
        
      case 429:
        // Rate limited
        const retryAfter = response.data.data?.retry_after || 60;
        showToast(`Too many attempts. Try again in ${retryAfter}s`, 'warning');
        break;
        
      default:
        showToast('An unexpected error occurred', 'error');
    }
    
    return Promise.reject(error);
  }
);
```

## Logging Errors

```php
<?php
use Illuminate\Support\Facades\Log;

// Log with context
Log::error('Payment processing failed', [
    'user_id' => $user->id,
    'subscription_id' => $subscription->id,
    'error' => $exception->getMessage(),
    'trace' => $exception->getTraceAsString(),
]);

// Channel-specific logging
Log::channel('slack')->critical('Database connection lost');
```

## References

- [`backend/app/Domains/Support/Traits/ApiResponseTrait.php`](/backend/app/Domains/Support/Traits/ApiResponseTrait.php)
- [`backend/bootstrap/app.php`](/backend/bootstrap/app.php)
- [`backend/app/Domains/Exams/Exceptions/`](/backend/app/Domains/Exams/Exceptions/)
- [`backend/app/Domains/Subscriptions/Exceptions/`](/backend/app/Domains/Subscriptions/Exceptions/)

## TODO

- [ ] Add structured logging with correlation IDs
- [ ] Document error tracking integration (Sentry)
- [ ] Add error analytics dashboard
- [ ] Document retry strategies for transient errors
