# API Conventions

## Overview

This document describes the API response conventions used throughout the Laravel Backend LMS project. All API responses follow a standardized format using the [`ApiResponseTrait`](../backend/app/Domains/Support/Traits/ApiResponseTrait.php).

## ApiResponseTrait

The [`ApiResponseTrait`](../backend/app/Domains/Support/Traits/ApiResponseTrait.php) provides a consistent interface for all API responses. It's used by the base [`Controller`](../backend/app/Domains/Application/Http/Controllers/Controller.php) class and is available in all controllers.

### Location
- **File:** `backend/app/Domains/Support/Traits/ApiResponseTrait.php`
- **Namespace:** `App\Domains\Support\Traits`

### Usage

All controllers extend the base [`Controller`](../backend/app/Domains/Application/Http/Controllers/Controller.php) which uses the trait:

```php
<?php

namespace App\Domains\Application\Http\Controllers;

use App\Domains\Support\Traits\ApiResponseTrait;

abstract class Controller
{
    use ApiResponseTrait;
}
```

## Response Formats

### Success Response (200 OK)

Used for successful operations that return data.

**Method:** `successResponse(mixed $data = null, string $message = 'تمت العملية بنجاح', int $code = 200): JsonResponse`

**Example:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "تمت العملية بنجاح",
  "data": {
    "id": "uuid",
    "name": "Example"
  }
}
```

**Usage:**
```php
return $this->successResponse($data, 'تم جلب البيانات بنجاح');
```

### Created Response (201 Created)

Used for successful resource creation.

**Method:** `created(mixed $data = null, string $message = 'تم الإنشاء بنجاح'): JsonResponse`

**Example:**
```json
{
  "status": true,
  "status_code": 201,
  "message": "تم الإنشاء بنجاح",
  "data": {
    "id": "uuid",
    "name": "New Resource"
  }
}
```

**Usage:**
```php
return $this->created($resource, 'تم إنشاء الطالب بنجاح');
```

### Error Response (400/4xx)

Used for client errors with optional error details.

**Method:** `errorResponse(string $message = 'حدث خطأ', mixed $errors = null, int $code = 400, mixed $data = null): JsonResponse`

**Example (with errors):**
```json
{
  "status": false,
  "status_code": 400,
  "message": "حدث خطأ",
  "errors": {
    "email": [
      "البريد الإلكتروني مطلوب"
    ]
  }
}
```

**Example (with data):**
```json
{
  "status": false,
  "status_code": 400,
  "message": "حدث خطأ",
  "data": {
    "retry_after": 60
  }
}
```

**Usage:**
```php
return $this->errorResponse('حدث خطأ في البيانات', $validator->errors(), 422);
```

### Unauthorized Response (401 Unauthorized)

Used when authentication is required but not provided.

**Method:** `unauthorized(string $message = 'غير مصرح بالدخول'): JsonResponse`

**Example:**
```json
{
  "status": false,
  "status_code": 401,
  "message": "غير مصرح بالدخول"
}
```

**Usage:**
```php
return $this->unauthorized('يجب تسجيل الدخول أولاً');
```

### Forbidden Response (403 Forbidden)

Used when the user is authenticated but lacks permission.

**Method:** `forbidden(string $message = 'ليس لديك الصلاحية'): JsonResponse`

**Example:**
```json
{
  "status": false,
  "status_code": 403,
  "message": "ليس لديك الصلاحية"
}
```

**Usage:**
```php
return $this->forbidden('ليس لديك صلاحية الوصول لهذا المحتوى');
```

### Not Found Response (404 Not Found)

Used when a requested resource doesn't exist.

**Method:** `notFound(string $message = 'العنصر غير موجود'): JsonResponse`

**Example:**
```json
{
  "status": false,
  "status_code": 404,
  "message": "العنصر غير موجود"
}
```

**Usage:**
```php
return $this->notFound('الطالب غير موجود');
```

### Validation Error Response (422 Unprocessable Entity)

Used for validation failures.

**Method:** `validationError(mixed $errors, string $message = 'بيانات غير صالحة'): JsonResponse`

**Example:**
```json
{
  "status": false,
  "status_code": 422,
  "message": "بيانات غير صالحة",
  "errors": {
    "phone": [
      "رقم الهاتف يجب أن يكون فريداً"
    ],
    "password": [
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
    ]
  }
}
```

**Usage:**
```php
return $this->validationError($validator->errors(), 'بيانات النموذج غير صالحة');
```

### Too Many Requests Response (429 Too Many Requests)

Used when rate limits are exceeded.

**Method:** `tooManyRequests(string $message = 'تم تجاوز الحد المسموح به'): JsonResponse`

**Example:**
```json
{
  "status": false,
  "status_code": 429,
  "message": "تم تجاوز الحد المسموح به"
}
```

**Usage:**
```php
return $this->tooManyRequests('تم تجاوز الحد المسموح من المحاولات');
```

### Paginated Response

Used for paginated list responses with metadata.

**Method:** `paginated(mixed $paginator, mixed $resource, string $message = 'تم الجلب بنجاح'): JsonResponse`

**Example:**
```json
{
  "status": true,
  "status_code": 200,
  "message": "تم الجلب بنجاح",
  "data": [
    {
      "id": "uuid",
      "name": "Item 1"
    },
    {
      "id": "uuid",
      "name": "Item 2"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "https://api.example.com/students?page=1",
    "last": "https://api.example.com/students?page=5",
    "prev": null,
    "next": "https://api.example.com/students?page=2"
  }
}
```

**Usage:**
```php
$students = Student::paginate(15);
return $this->paginated($students, StudentResource::collection($students));
```

### No Content Response (204 No Content)

Used for successful operations that don't return data (e.g., delete).

**Method:** `noContent(string $message = 'تمت العملية بنجاح'): JsonResponse`

**Example:**
```json
{
  "status": true,
  "status_code": 204,
  "message": "تمت العملية بنجاح"
}
```

**Usage:**
```php
return $this->noContent('تم حذف الطالب بنجاح');
```

## Response Structure

All responses follow this structure:

```json
{
  "status": boolean,           // true for success, false for error
  "status_code": integer,      // HTTP status code
  "message": string,           // User-friendly message (Arabic)
  "data": object|array|null,   // Response payload (optional)
  "errors": object|null,       // Validation errors (optional)
  "meta": object|null,         // Pagination metadata (optional)
  "links": object|null         // Pagination links (optional)
}
```

## HTTP Status Codes

| Code | Method | Description |
|------|--------|-------------|
| 200 | `successResponse()` | Successful request with data |
| 201 | `created()` | Resource created successfully |
| 204 | `noContent()` | Successful operation with no return data |
| 400 | `errorResponse()` | Bad request |
| 401 | `unauthorized()` | Authentication required |
| 403 | `forbidden()` | Insufficient permissions |
| 404 | `notFound()` | Resource not found |
| 422 | `validationError()` | Validation failed |
| 429 | `tooManyRequests()` | Rate limit exceeded |

## Best Practices

### 1. Use Appropriate Methods
- Use `successResponse()` for successful GET requests
- Use `created()` for POST requests that create resources
- Use `noContent()` for DELETE or PUT requests
- Use `validationError()` for form validation failures
- Use specific error methods (`unauthorized`, `forbidden`, `notFound`) when applicable

### 2. Provide Clear Messages
All messages should be in Arabic and user-friendly:

```php
// ✅ Good
return $this->successResponse($data, 'تم جلب قائمة الطلاب بنجاح');

// ❌ Bad
return $this->successResponse($data, 'Success');
```

### 3. Use Resources for Data Transformation
Always use Laravel API resources to transform models:

```php
use App\Domains\Auth\Resources\StudentResource;

// ✅ Good
return $this->successResponse(StudentResource::make($student));

// ❌ Bad
return $this->successResponse($student->toArray());
```

### 4. Handle Validation Errors Properly
Use Laravel's form request validation and return proper error responses:

```php
// In Form Request
public function rules(): array
{
    return [
        'name' => 'required|string|max:255',
        'phone' => 'required|unique:students,phone',
    ];
}

// In Controller
public function store(StoreStudentRequest $request)
{
    // Validation happens automatically
    $student = Student::create($request->validated());
    return $this->created(StudentResource::make($student));
}
```

### 5. Consistent Error Handling
Use try-catch blocks and return appropriate error responses:

```php
try {
    $result = $this->service->process($data);
    return $this->successResponse($result);
} catch (ModelNotFoundException $e) {
    return $this->notFound('المورد المطلوب غير موجود');
} catch (\Exception $e) {
    return $this->errorResponse('حدث خطأ أثناء المعالجة');
}
```

### 6. Pagination for Lists
Always paginate list responses:

```php
// ✅ Good
$students = Student::with('grade', 'group')->paginate(15);
return $this->paginated($students, StudentResource::collection($students));

// ❌ Bad
$students = Student::all();
return $this->successResponse(StudentResource::collection($students));
```

## Common Response Examples

### Login Response
```json
{
  "status": true,
  "status_code": 200,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "id": "uuid",
      "name": "أحمد محمد",
      "phone": "+201234567890"
    },
    "token": "access_token_here",
    "refresh_token": "refresh_token_here"
  }
}
```

### List Response
```json
{
  "status": true,
  "status_code": 200,
  "message": "تم جلب القائمة بنجاح",
  "data": [
    {
      "id": "uuid",
      "name": "الصف الأول"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 5,
    "from": 1,
    "to": 5
  },
  "links": {
    "first": "https://api.example.com/grades?page=1",
    "last": "https://api.example.com/grades?page=1",
    "prev": null,
    "next": null
  }
}
```

### Error Response
```json
{
  "status": false,
  "status_code": 422,
  "message": "بيانات غير صالحة",
  "errors": {
    "phone": [
      "رقم الهاتف مسجل مسبقاً"
    ],
    "password": [
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
    ]
  }
}
```

## API Versioning

The API is versioned through route prefixes. Currently, the API uses version 1:

```
/api/v1/...
```

## Authentication

Most endpoints require authentication using Laravel Sanctum. Include the access token in the Authorization header:

```
Authorization: Bearer {access_token}
```

For endpoints that support cookie-based authentication (e.g., web views), the token is automatically included in cookies.

## Language

All API messages are in Arabic. The response format supports Arabic characters properly with UTF-8 encoding.

## Error Codes Reference

| Status Code | Meaning | When to Use |
|-------------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST request creating resource |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Malformed request, invalid parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors (use sparingly) |
