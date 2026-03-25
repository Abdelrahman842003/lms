# Security & Authorization

This document covers the security architecture, authorization policies, and middleware used in the application.

## Overview

The application implements a multi-layered security approach:

1. **Authentication** - Laravel Sanctum token-based authentication with multiple guards
2. **Authorization** - Policy-based access control with permission checks
3. **Middleware** - Request filtering for suspension, subscription, and rate limiting
4. **Rate Limiting** - Throttling sensitive endpoints

---

## Authentication

See [Authentication Documentation](./auth.md) for detailed authentication flows.

### Guards

| Guard | Model | Description |
|-------|-------|-------------|
| `academy` | Academy | Organization administrators |
| `teacher` | Teacher | Teachers/Instructors |
| `student` | Student | Students |
| `secretary` | Secretary | Secretary assistants |
| `guardian` | Guardian | Parents/Guardians |

### Token Authentication

All API requests require a Bearer token:

```
Authorization: Bearer <token>
```

Tokens are managed via Laravel Sanctum with abilities tracking.

---

## Authorization Policies

Policies implement authorization logic for each model. They determine what actions a user can perform on a resource.

### BasePolicy

All policies extend [`BasePolicy`](../../backend/app/Domains/Application/Policies/BasePolicy.php) which provides standard CRUD authorization methods.

**Location:** `App\Domains\Application\Policies\BasePolicy`

**Standard Methods:**

| Method | Description |
|--------|-------------|
| `viewAny($user)` | Can view list of resources |
| `view($user, $model)` | Can view specific resource |
| `create($user)` | Can create new resource |
| `update($user, $model)` | Can update resource |
| `delete($user, $model)` | Can delete resource |
| `restore($user, $model)` | Can restore soft-deleted resource |
| `forceDelete($user, $model)` | Can permanently delete |

**Authorization Logic:**

1. **Permission Check** - User has the required permission
2. **Ownership Check** - User owns the resource
3. **Role Check** - User has appropriate role

```php
// BasePolicy authorization logic
public function view($user, Model $model): bool
{
    return $this->hasPermission($user, 'view')
        || $this->ownsResource($user, $model);
}
```

---

### Policy Reference

#### Auth Domain

##### StudentPolicy

**Location:** [`App\Domains\Auth\Policies\StudentPolicy`](../../backend/app/Domains/Auth/Policies/StudentPolicy.php)

**Supported Users:** Teacher, Secretary, Academy

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View student | Student enrolled with user |
| `update` | Update student | Student enrolled with user |
| `delete` | Delete student | Student enrolled with user |
| `updatePermissions` | Update permissions | Student enrolled with user |

**Usage:**
```php
// Controller
$this->authorize('view', $student);

// Blade
@can('view', $student)
```

---

#### Exams Domain

##### ExamPolicy

**Location:** [`App\Domains\Exams\Policies\ExamPolicy`](../../backend/app/Domains/Exams/Policies/ExamPolicy.php)

**Supported Users:** Teacher, Secretary

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View exam | Exam belongs to teacher |
| `update` | Update exam | Exam belongs to teacher |
| `delete` | Delete exam | Exam belongs to teacher |
| `viewResults` | View results | Exam belongs to teacher |
| `copy` | Copy exam | Exam belongs to teacher |

**Secretary Support:**
Secretaries act on behalf of their associated teacher:
```php
private function resolveTeacher(Teacher|Secretary $user): ?Teacher
{
    if ($user instanceof Secretary) {
        return $user->teachers()->first();
    }
    return $user;
}
```

---

#### Videos Domain

##### VideoPolicy

**Location:** [`App\Domains\Videos\Policies\VideoPolicy`](../../backend/app/Domains/Videos/Policies/VideoPolicy.php)

**Supported Users:** Teacher, Secretary, Academy

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View video | Video belongs to user's context |
| `update` | Update video | Video belongs to user's context |
| `delete` | Delete video | Video belongs to user's context |
| `publish` | Publish video | Video belongs to user's context |

---

#### Lectures Domain

##### LecturePolicy

**Location:** [`App\Domains\Lectures\Policies\LecturePolicy`](../../backend/app/Domains/Lectures/Policies/LecturePolicy.php)

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View lecture | Lecture belongs to teacher |
| `update` | Update lecture | Lecture belongs to teacher |
| `delete` | Delete lecture | Lecture belongs to teacher |
| `manageAttendance` | Manage attendance | Lecture belongs to teacher |

---

#### Enrollments Domain

##### GradePolicy

**Location:** [`App\Domains\Enrollments\Policies\GradePolicy`](../../backend/app/Domains/Enrollments/Policies/GradePolicy.php)

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View grade | Grade belongs to teacher |
| `create` | Create grade | Authenticated user |
| `update` | Update grade | Grade belongs to teacher |
| `delete` | Delete grade | Grade belongs to teacher |

##### GroupPolicy

**Location:** [`App\Domains\Enrollments\Policies\GroupPolicy`](../../backend/app/Domains/Enrollments/Policies/GroupPolicy.php)

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View group | Group belongs to teacher |
| `create` | Create group | Authenticated user |
| `update` | Update group | Group belongs to teacher |
| `delete` | Delete group | Group belongs to teacher |

##### EnrollmentPolicy

**Location:** [`App\Domains\Enrollments\Policies\EnrollmentPolicy`](../../backend/app/Domains/Enrollments/Policies/EnrollmentPolicy.php)

| Method | Description | Authorization |
|--------|-------------|---------------|
| `view` | View enrollment | Enrollment belongs to teacher |
| `create` | Create enrollment | Authenticated user |
| `update` | Update enrollment | Enrollment belongs to teacher |
| `delete` | Delete enrollment | Enrollment belongs to teacher |

---

#### Application Domain Policies

The Application domain contains numerous policies for cross-cutting concerns:

| Policy | Description |
|--------|-------------|
| `AcademyPolicy` | Academy management authorization |
| `TeacherPolicy` | Teacher management authorization |
| `SecretaryPolicy` | Secretary management authorization |
| `GuardianPolicy` | Guardian management authorization |
| `SubscriptionPolicy` | Subscription management |
| `PaymentLogPolicy` | Payment log access |
| `DeviceTokenPolicy` | FCM device token management |
| `VideoAccessGrantPolicy` | Video access grants |
| `VideoCommentPolicy` | Video comment moderation |
| `VideoQuizPolicy` | Video quiz management |
| `GamificationSettingPolicy` | Gamification settings |
| `SettingPolicy` | System settings access |
| `SyncErrorPolicy` | Sync error management |
| `AttendancePolicy` | Attendance records access |

---

## Middleware

Middleware filters HTTP requests before they reach controllers.

### Authentication Middleware

#### InjectBearerTokenFromCookie

**Location:** [`App\Domains\Auth\Http\Middleware\InjectBearerTokenFromCookie`](../../backend/app/Domains/Auth/Http/Middleware/InjectBearerTokenFromCookie.php)

**Purpose:** Bridges httpOnly `access_token` cookie to Authorization header for Sanctum authentication.

**How it works:**
1. Checks if Authorization header exists
2. If not, reads `access_token` cookie
3. Injects cookie value as Bearer token

**Usage:**
```php
Route::middleware(['auth.cookies'])->group(function () {
    // Routes that accept cookie-based auth
});
```

---

#### SetAuthCookies

**Location:** [`App\Domains\Auth\Http\Middleware\SetAuthCookies`](../../backend/app/Domains/Auth/Http/Middleware/SetAuthCookies.php)

**Purpose:** Sets authentication cookies after successful login.

---

### Authorization Middleware

#### EnsureUserNotSuspended

**Location:** [`App\Domains\Auth\Http\Middleware\EnsureUserNotSuspended`](../../backend/app/Domains/Auth/Http/Middleware/EnsureUserNotSuspended.php)

**Purpose:** Prevents suspended users from accessing protected routes.

**Features:**
- Cache-based suspension status (5-minute TTL)
- Guard-specific checks (teacher, secretary)
- Independent teacher status verification

**Parameters:**
- `$guard` - The guard to check (teacher, secretary, student)

**Usage:**
```php
Route::middleware(['auth:sanctum', EnsureUserNotSuspended::class . ':teacher'])
    ->prefix('teacher')
    ->group(function () {
        // Teacher routes
    });
```

**Error Responses:**

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `ACCOUNT_SUSPENDED` | Your account is suspended. | 403 |
| `ACCOUNT_NOT_APPROVED` | حسابك قيد المراجعة | 403 |
| `TEACHER_INDEPENDENT_INACTIVE` | Independent account inactive | 403 |

---

#### EnsureTeacherNotSuspendedForStudent

**Location:** [`App\Domains\Auth\Http\Middleware\EnsureTeacherNotSuspendedForStudent`](../../backend/app/Domains/Auth/Http/Middleware/EnsureTeacherNotSuspendedForStudent.php)

**Purpose:** Prevents students from accessing data of suspended teachers.

**How it works:**
1. Extracts `teacher_id` from request (query, body, or route param)
2. Checks cached suspension status
3. Blocks access if teacher is suspended

**Usage:**
```php
Route::middleware(['auth:sanctum', EnsureTeacherNotSuspendedForStudent::class])
    ->prefix('student')
    ->group(function () {
        // Student routes that may access teacher data
    });
```

**Error Response:**
```json
{
    "message": "عفواً، هذا المدرس (أحمد) معلق حالياً ولا يمكن الوصول لبياناته.",
    "error": "TEACHER_SUSPENDED"
}
```

---

#### EnsureActiveSubscription

**Location:** [`App\Domains\Auth\Http\Middleware\EnsureActiveSubscription`](../../backend/app/Domains/Auth/Http/Middleware/EnsureActiveSubscription.php)

**Purpose:** Ensures user has an active subscription for premium features.

**How it works:**
1. Checks if authenticated user is a Teacher
2. Verifies active subscription via `hasActiveSubscription()` method
3. Blocks access if subscription expired

**Usage:**
```php
Route::middleware(['auth:sanctum', EnsureActiveSubscription::class])
    ->group(function () {
        // Routes requiring active subscription
    });
```

**Error Response:**
```json
{
    "status": false,
    "status_code": 403,
    "message": "انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للمتابعة.",
    "error": "SUBSCRIPTION_EXPIRED"
}
```

---

#### EnsureActiveEnrollment

**Location:** [`App\Domains\Auth\Http\Middleware\EnsureActiveEnrollment`](../../backend/app/Domains/Auth/Http/Middleware/EnsureActiveEnrollment.php)

**Purpose:** Ensures student has active enrollment for accessing content.

---

### Rate Limiting Middleware

#### LoginThrottleMiddleware

**Location:** [`App\Domains\Auth\Http\Middleware\LoginThrottleMiddleware`](../../backend/app/Domains/Auth/Http/Middleware/LoginThrottleMiddleware.php)

**Purpose:** Custom rate limiting for login attempts.

---

#### RateLimitOtp

**Location:** [`App\Domains\Auth\Http\Middleware\RateLimitOtp`](../../backend/app/Domains/Auth/Http/Middleware/RateLimitOtp.php)

**Purpose:** Rate limits OTP requests to prevent abuse.

---

### Built-in Laravel Middleware

The application also uses Laravel's built-in middleware:

| Middleware | Purpose |
|------------|---------|
| `auth:sanctum` | Sanctum authentication |
| `throttle:auth` | Rate limit authentication endpoints |
| `throttle:notifications` | Rate limit notification sending |
| `throttle:payments` | Rate limit payment operations |
| `throttle:video-upload` | Rate limit video uploads |
| `throttle:video-stream` | Rate limit video streaming |
| `throttle:attendance` | Rate limit attendance marking |
| `throttle:exam-submit` | Rate limit exam submissions |

---

## Route Protection Patterns

### Standard Protected Route

```php
Route::middleware('auth:sanctum')->group(function () {
    // Authenticated routes
});
```

### Teacher Routes with Full Protection

```php
Route::middleware([
    'auth:sanctum',
    EnsureUserNotSuspended::class . ':teacher',
    EnsureActiveSubscription::class
])->prefix('teacher')->group(function () {
    // Fully protected teacher routes
});
```

### Student Routes with Teacher Suspension Check

```php
Route::middleware([
    'auth:sanctum',
    EnsureTeacherNotSuspendedForStudent::class
])->prefix('student')->group(function () {
    // Student routes with teacher check
});
```

### Rate Limited Routes

```php
Route::middleware(['auth:sanctum', 'throttle:notifications'])->group(function () {
    Route::post('/notifications', [NotificationController::class, 'store']);
});
```

---

## Permission System

### Permission Structure

Permissions follow the pattern `{resource}.{action}`:

| Permission | Description |
|------------|-------------|
| `students.view` | View students |
| `students.create` | Create students |
| `students.update` | Update students |
| `students.delete` | Delete students |
| `exams.view` | View exams |
| `exams.create` | Create exams |
| `videos.view` | View videos |
| `videos.publish` | Publish videos |

### Checking Permissions

**In Policy:**
```php
protected function hasPermission($user, string $action): bool
{
    $permission = "{$this->resource}.{$action}";
    return $user->hasPermissionTo($permission);
}
```

**In Controller:**
```php
if ($user->can('view', $student)) {
    // Authorized
}
```

**In Blade:**
```blade
@can('view', $student)
    <!-- Show content -->
@endcan
```

---

## Security Best Practices

### 1. Always Use Policies

Don't check authorization directly in controllers:

```php
// Bad
if ($student->teacher_id !== $user->id) {
    abort(403);
}

// Good
$this->authorize('view', $student);
```

### 2. Use Route Middleware

Apply middleware at route group level:

```php
// Good - Applied to entire group
Route::middleware(['auth:sanctum', EnsureActiveSubscription::class])
    ->group(function () {
        // All routes protected
    });
```

### 3. Cache Suspension Status

Suspension checks are cached for 5 minutes to reduce database queries:

```php
$cacheKey = "user:{$user->id}:suspension_status";
$suspensionStatus = Cache::remember($cacheKey, 300, function () use ($user) {
    return ['is_suspended' => $user->status === 'suspended'];
});
```

### 4. Clear Cache on Status Change

When user status changes, clear the cache:

```php
Cache::forget("user:{$user->id}:suspension_status");
```

---

## Error Responses

### 401 Unauthorized

```json
{
    "message": "Unauthenticated."
}
```

### 403 Forbidden

```json
{
    "message": "This action is unauthorized.",
    "error": "FORBIDDEN"
}
```

### 403 Subscription Expired

```json
{
    "message": "انتهت صلاحية اشتراكك.",
    "error": "SUBSCRIPTION_EXPIRED"
}
```

### 403 Account Suspended

```json
{
    "message": "Your account is suspended.",
    "error": "ACCOUNT_SUSPENDED"
}
```

### 429 Too Many Requests

```json
{
    "message": "Too many attempts. Please try again later.",
    "error": "RATE_LIMITED"
}
```

---

## References

- [Authentication Documentation](./auth.md)
- [API Reference](./api.md)
- [Error Handling](./errors.md)
- [Laravel Authorization](https://laravel.com/docs/11.x/authorization)
- [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum)

## TODO

- [ ] Document all Application domain policies
- [ ] Add permission matrix by role
- [ ] Document audit logging for security events
- [ ] Add security testing guidelines
