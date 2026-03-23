# 🔐 Laravel 12 Deep Security Audit Report

**Audit Date:** 2026-03-23  
**Project:** Educational Platform Backend  
**Scope:** Comprehensive security review of Laravel 12 backend application

---

## Executive Summary

This security audit identified **3 Critical**, **7 High**, **12 Medium**, and **8 Low** risk issues across the Laravel 12 backend application. The most severe findings involve SQL injection vulnerabilities, widespread authorization bypass in Form Requests, and missing model policies.

### Risk Distribution

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Requires Immediate Action |
| 🟠 High | 7 | Address Within 1 Week |
| 🟡 Medium | 12 | Address Within Sprint |
| 🟢 Low | 8 | Address When Possible |

---

## 🔴 Critical Vulnerabilities

### CVE-001: SQL Injection in AcademyGradeService

**File:** [`backend/app/Domains/Enrollments/Services/AcademyGradeService.php`](backend/app/Domains/Enrollments/Services/AcademyGradeService.php:45)  
**OWASP:** A03:2021 – Injection  
**Severity:** Critical

#### Vulnerable Code
```php
// Lines 44-46
\DB::raw('COUNT(DISTINCT g.teacher_id) as teachers_count'),
\DB::raw('(SELECT COUNT(*) FROM groups WHERE grade_id IN (SELECT id FROM grades WHERE name = g.name AND academy_id = ' . $academy->id . ')) as groups_count'),
\DB::raw('(SELECT COUNT(*) FROM enrollments WHERE grade_id IN (SELECT id FROM grades WHERE name = g.name AND academy_id = ' . $academy->id . ')) as students_count'),
```

#### Issue
Direct string interpolation of `$academy->id` into raw SQL queries without parameter binding. While `id` is typically a UUID, this pattern is dangerous and could be exploited if the model's ID is ever user-controlled.

#### Remediation
```php
\DB::raw('(SELECT COUNT(*) FROM groups WHERE grade_id IN (SELECT id FROM grades WHERE name = g.name AND academy_id = ?)) as groups_count'),
// Or use parameterized raw queries:
->selectRaw(
    '(SELECT COUNT(*) FROM groups WHERE grade_id IN (SELECT id FROM grades WHERE name = g.name AND academy_id = ?)) as groups_count',
    [$academy->id]
)
```

---

### CVE-002: Authorization Bypass in Form Requests

**Files:** 98 Form Request classes  
**OWASP:** A01:2021 – Broken Access Control  
**Severity:** Critical

#### Issue
All 98 Form Request classes implement `authorize(): bool { return true; }`, completely bypassing authorization checks. This allows any authenticated user to perform any action regardless of permissions.

#### Affected Files (Sample)
- [`backend/app/Domains/Application/Http/Requests/Auth/UpdateProfileRequest.php`](backend/app/Domains/Application/Http/Requests/Auth/UpdateProfileRequest.php:11)
- [`backend/app/Domains/Application/Http/Requests/Teacher/Student/StoreStudentRequest.php`](backend/app/Domains/Application/Http/Requests/Teacher/Student/StoreStudentRequest.php:11)
- [`backend/app/Domains/Application/Http/Requests/Teacher/Video/InitiateUploadRequest.php`](backend/app/Domains/Application/Http/Requests/Teacher/Video/InitiateUploadRequest.php:12)
- And 95 more...

#### Vulnerable Pattern
```php
public function authorize(): bool
{
    return true; // ⚠️ Always allows access
}
```

#### Remediation
```php
public function authorize(): bool
{
    // Example for video update
    $video = $this->route('video');
    return Gate::allows('update', $video);
    
    // Or for creating resources
    return Gate::allows('createIndependent', Video::class);
}
```

---

### CVE-003: Missing Model Policies (39 of 44 Models)

**OWASP:** A01:2021 – Broken Access Control  
**Severity:** Critical

#### Issue
Only 5 policies exist for 44 models, leaving 39 models without proper authorization:

| Existing Policies | Missing For |
|-------------------|-------------|
| [`VideoPolicy`](backend/app/Domains/Videos/Policies/VideoPolicy.php) | Student, Guardian, Secretary |
| [`LecturePolicy`](backend/app/Domains/Lectures/Policies/LecturePolicy.php) | Academy, Admin |
| [`ExamPolicy`](backend/app/Domains/Exams/Policies/ExamPolicy.php) | Attendance, PaymentLog |
| [`GradePolicy`](backend/app/Domains/Enrollments/Policies/GradePolicy.php) | Subscription, Notification |
| [`GroupPolicy`](backend/app/Domains/Enrollments/Policies/GroupPolicy.php) | And 34 more... |

#### Remediation Priority
1. Create policies for authentication models (Student, Teacher, Academy, Guardian, Secretary)
2. Create policies for sensitive data models (PaymentLog, Subscription)
3. Create policies for content models (Video, Lecture, Exam)

---

## 🟠 High-Risk Issues

### HIGH-001: Sensitive Fields in Mass Assignment

**Files:** Multiple model files  
**OWASP:** A08:2021 – Software and Data Integrity Failures  
**Severity:** High

#### Issue
Several models have sensitive fields in `$fillable` arrays that could be mass-assigned by malicious input:

##### [`backend/app/Domains/Auth/Models/Teacher.php`](backend/app/Domains/Auth/Models/Teacher.php:37)
```php
protected $fillable = [
    'name', 'phone', 'subject', 'password', 'avatar_key', 'status',
    'subscription_fee', 'paid_amount', // ⚠️ Financial fields
    'is_independent_active',
    'plan_type', 'plan_expires_at', // ⚠️ Subscription fields
    'plan_max_students', 'is_unlimited_students',
    'storage_limit_gb', 'storage_used_bytes', // ⚠️ Could be manipulated
    'discount_percent',
];
```

##### [`backend/app/Domains/Auth/Models/Student.php`](backend/app/Domains/Auth/Models/Student.php:33)
```php
protected $fillable = [
    'name', 'password', 'avatar_key', 'phone', 'parent_phone',
    'guardian_id', 'gender', 'education_type', 'location',
    'teacher_id', 'is_active', // ⚠️ Could change own status
];
```

#### Remediation
```php
// Remove sensitive fields from $fillable
protected $fillable = [
    'name', 'phone', 'subject', 'avatar_key',
];

// Use explicit assignment for sensitive fields
$teacher->update([
    'status' => 'active', // Only in authorized contexts
]);
```

---

### HIGH-002: Potential IDOR in Controller Routes

**Files:** Multiple controllers  
**OWASP:** A01:2021 – Broken Access Control  
**Severity:** High

#### Issue
Several controllers use `findOrFail($id)` without proper ownership verification:

##### [`backend/app/Domains/Application/Http/Controllers/Teacher/VideoController.php`](backend/app/Domains/Application/Http/Controllers/Teacher/VideoController.php:72)
```php
public function show(Request $request, Video $video): JsonResponse
{
    $teacher = $this->getTeacherFromRequest($request);
    Gate::authorize('view', $video); // ✅ Good - uses policy
```

However, some routes lack this protection:

##### [`backend/app/Domains/Application/Http/Controllers/Teacher/GamificationController.php`](backend/app/Domains/Application/Http/Controllers/Teacher/GamificationController.php:76)
```php
$student = Student::findOrFail($data['student_id']);
// ⚠️ No verification that teacher owns this student
```

#### Remediation
```php
$student = Student::where('id', $data['student_id'])
    ->whereHas('enrollments', fn($q) => $q->where('teacher_id', $teacher->id))
    ->firstOrFail();
```

---

### HIGH-003: Long-Lived Refresh Tokens

**File:** [`backend/app/Domains/Auth/Services/TokenService.php`](backend/app/Domains/Auth/Services/TokenService.php:25)  
**OWASP:** A07:2021 – Identification and Authentication Failures  
**Severity:** High

#### Issue
```php
private const REFRESH_TOKEN_LIFETIME_EXTENDED_DAYS = 365; // 1 year!
```

Refresh tokens with "remember me" last for 365 days, which is excessive and increases the window for token theft.

#### Remediation
```php
private const REFRESH_TOKEN_LIFETIME_EXTENDED_DAYS = 30; // 30 days max
private const REFRESH_TOKEN_LIFETIME_DAYS = 7; // 7 days without remember
```

---

### HIGH-004: Missing Rate Limiting on Sensitive Endpoints

**File:** [`backend/app/Providers/AppServiceProvider.php`](backend/app/Providers/AppServiceProvider.php:197)  
**OWASP:** A07:2021 – Identification and Authentication Failures  
**Severity:** High

#### Current Implementation
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(60));
RateLimiter::for('login', fn($request) => Limit::perMinute(10));
RateLimiter::for('video-playback', fn($request) => Limit::perMinute(30));
RateLimiter::for('video-upload', fn($request) => Limit::perMinute(6));
```

#### Missing Rate Limiting For
- Password change endpoints
- Student creation/enrollment
- Payment processing
- Notification sending
- API token refresh

#### Remediation
```php
RateLimiter::for('password-change', fn($request) => Limit::perHour(3)->by($request->user()->id));
RateLimiter::for('enrollment', fn($request) => Limit::perMinute(10)->by($request->user()->id));
RateLimiter::for('payment', fn($request) => Limit::perMinute(5)->by($request->user()->id));
RateLimiter::for('notification', fn($request) => Limit::perMinute(20)->by($request->user()->id));
```

---

### HIGH-005: XSS Risk in Input Handling

**Files:** Multiple Form Requests  
**OWASP:** A03:2021 – Injection  
**Severity:** High

#### Issue
Only some Form Requests use `strip_tags()` in `prepareForValidation()`:

##### Good Example - [`StoreStudentRequest`](backend/app/Domains/Application/Http/Requests/Teacher/Student/StoreStudentRequest.php:48)
```php
public function prepareForValidation()
{
    $this->merge([
        'name' => strip_tags($this->input('name')),
        'phone' => strip_tags($this->input('phone')),
    ]);
}
```

##### Missing in Most Other Requests
Most Form Requests don't sanitize input, leaving potential XSS vectors.

#### Remediation
Apply `strip_tags()` or HTML Purifier to all text inputs across all Form Requests.

---

### HIGH-006: Device Fingerprint Manipulation

**File:** [`backend/app/Domains/Application/Http/Controllers/Student/VideoController.php`](backend/app/Domains/Application/Http/Controllers/Student/VideoController.php:118)  
**OWASP:** A07:2021 – Identification and Authentication Failures  
**Severity:** High

#### Issue
```php
if ($request->filled('device_fingerprint')) {
    $request->headers->set('X-Device-Fingerprint', (string) $request->validated('device_fingerprint'));
}
```

Device fingerprint is accepted from request body and set as header, potentially allowing device limit bypass.

#### Remediation
Device fingerprint should only be accepted from headers, not request body:
```php
// Remove this block - only trust headers
$fingerprint = $request->header('X-Device-Fingerprint');
```

---

### HIGH-007: Insecure File Extension Handling

**File:** [`backend/app/Domains/Videos/Services/VideoStorageService.php`](backend/app/Domains/Videos/Services/VideoStorageService.php:19)  
**OWASP:** A03:2021 – Injection  
**Severity:** High

#### Issue
```php
$extension = strtolower((string) $file->getClientOriginalExtension()) ?: 'bin';
```

`getClientOriginalExtension()` uses the user-provided filename extension which can be spoofed. A file named `malicious.php.mp4` could potentially be processed.

#### Remediation
```php
$extension = strtolower($file->guessExtension() ?: 'bin');
// Or use mime_type to extension mapping
```

---

## 🟡 Medium-Risk Issues

### MED-001: CORS Configuration Too Permissive for Development

**File:** [`backend/config/cors.php`](backend/config/cors.php:22)  
**OWASP:** A01:2021 – Broken Access Control  
**Severity:** Medium

#### Issue
```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://75.119.130.3', // ⚠️ Production IP in config
    'http://neetaq.com',
    'https://neetaq.com',
],
```

Development origins mixed with production origins in the same config.

#### Remediation
Use environment-based CORS configuration:
```php
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
```

---

### MED-002: Password Hashing Cast Without Algorithm Specification

**Files:** All auth models  
**OWASP:** A02:2021 – Cryptographic Failures  
**Severity:** Medium

#### Issue
```php
protected function casts(): array
{
    return [
        'password' => 'hashed', // Uses default algorithm
    ];
}
```

Laravel's `hashed` cast uses bcrypt by default. While secure, Argon2id is recommended for new applications.

#### Remediation
Ensure `config/hashing.php` uses Argon2id:
```php
'driver' => 'argon2id',
```

---

### MED-003: Missing Input Validation for File Size

**File:** [`backend/app/Domains/Application/Http/Requests/Teacher/Video/InitiateUploadRequest.php`](backend/app/Domains/Application/Http/Requests/Teacher/Video/InitiateUploadRequest.php:34)  
**OWASP:** A04:2021 – Insecure Design  
**Severity:** Medium

#### Issue
```php
'file_size' => ['required', 'integer', 'min:1'],
// ⚠️ No maximum file size validation
```

No maximum file size limit in the request validation, allowing potential storage exhaustion attacks.

#### Remediation
```php
'file_size' => ['required', 'integer', 'min:1', 'max:5368709120'], // 5GB max
```

---

### MED-004: QR Code Security

**File:** [`backend/app/Domains/Auth/Models/Academy.php`](backend/app/Domains/Auth/Models/Academy.php:73)  
**OWASP:** A02:2021 – Cryptographic Failures  
**Severity:** Medium

#### Issue
```php
$academy->checkin_qr_code = Str::random(32);
$academy->checkout_qr_code = Str::random(32);
```

Using `Str::random()` which is not cryptographically secure for security-sensitive tokens.

#### Remediation
```php
use Illuminate\Support\Str;
$academy->checkin_qr_code = Str::ulid()->toBase32(); // Or use random_bytes
```

---

### MED-005: Token Prefix Not Configured

**File:** [`backend/config/sanctum.php`](backend/config/sanctum.php:65)  
**OWASP:** A05:2021 – Security Misconfiguration  
**Severity:** Medium

#### Issue
```php
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),
```

Empty default token prefix reduces ability to detect leaked tokens via secret scanning.

#### Remediation
```php
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'neetaq_live_'),
```

---

### MED-006: Sanctum Expiration Not Set

**File:** [`backend/config/sanctum.php`](backend/config/sanctum.php:50)  
**OWASP:** A07:2021 – Identification and Authentication Failures  
**Severity:** Medium

#### Issue
```php
'expiration' => null,
```

No global token expiration, relying solely on token-level expiration which could be missed.

#### Remediation
```php
'expiration' => 43200, // 30 days in minutes
```

---

### MED-007: Missing Audit Logging for Sensitive Operations

**Files:** Multiple services  
**OWASP:** A09:2021 – Security Logging and Monitoring Failures  
**Severity:** Medium

#### Issue
Sensitive operations lack audit logging:
- Password changes
- Role/permission changes
- Payment confirmations
- Student data modifications

#### Remediation
Implement audit logging using Laravel Telescope or custom audit log:
```php
activity()
    ->causedBy(auth()->user())
    ->withProperties(['attributes' => $changes])
    ->log('Password changed');
```

---

### MED-008: Session Regeneration Missing After Login

**Files:** Auth Controllers  
**OWASP:** A07:2021 – Identification and Authentication Failures  
**Severity:** Medium

#### Issue
No explicit session regeneration after successful login in API controllers using Sanctum.

#### Remediation
```php
$request->session()->regenerate();
```

---

### MED-009: Error Messages May Expose Internal Information

**File:** [`backend/app/Domains/Videos/Services/VideoStreamingService.php`](backend/app/Domains/Videos/Services/VideoStreamingService.php:107)  
**OWASP:** A05:2021 – Security Misconfiguration  
**Severity:** Medium

#### Issue
```php
} catch (\Throwable) {
    return $this->streamPrivateFile($video->processed_path, 'video/mp4', false);
}
```

Silent exception handling without logging could hide security issues.

#### Remediation
```php
} catch (\Throwable $e) {
    Log::warning('Video streaming failed', ['error' => $e->getMessage()]);
    return $this->streamPrivateFile($video->processed_path, 'video/mp4', false);
}
```

---

### MED-010: Missing Content Security Policy Headers

**OWASP:** A05:2021 – Security Misconfiguration  
**Severity:** Medium

#### Issue
No CSP headers configured in the application.

#### Remediation
Add CSP middleware:
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\ContentSecurityPolicy::class);
})
```

---

### MED-011: Admin Guard Not Used Consistently

**File:** [`backend/config/sanctum.php`](backend/config/sanctum.php:37)  
**OWASP:** A07:2021 – Identification and Authentication Failures  
**Severity:** Medium

#### Issue
```php
'guard' => ['web', 'admin', 'teacher', 'student', 'secretary', 'guardian'],
```

Missing 'academy' guard in Sanctum configuration.

#### Remediation
```php
'guard' => ['web', 'admin', 'teacher', 'student', 'secretary', 'guardian', 'academy'],
```

---

### MED-012: Device Limit Service Uses Hardcoded Limits

**File:** [`backend/app/Domains/Auth/Services/DeviceLimitService.php`](backend/app/Domains/Auth/Services/DeviceLimitService.php:15)  
**OWASP:** A05:2021 – Security Misconfiguration  
**Severity:** Medium

#### Issue
```php
const DEVICE_LIMITS = [
    'App\Models\Student' => 4,
    'App\Models\Teacher' => 2,
    'App\Models\Secretary' => 1,
    'App\Models\Admin' => null,
];
```

Using old model namespace `App\Models\*` instead of domain-based `App\Domains\Auth\Models\*`.

#### Remediation
```php
const DEVICE_LIMITS = [
    'App\Domains\Auth\Models\Student' => 4,
    'App\Domains\Auth\Models\Teacher' => 2,
    // ...
];
```

---

## 🟢 Low-Risk Issues

### LOW-001: Debug Mode Check

**Recommendation:** Ensure `APP_DEBUG=false` in production via environment variables.

---

### LOW-002: APP_KEY Rotation

**Recommendation:** Implement APP_KEY rotation procedure for compromised keys.

---

### LOW-003: Missing HTTP Strict Transport Security (HSTS)

**Recommendation:** Add HSTS headers in production:
```php
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
```

---

### LOW-004: Missing X-Frame-Options Header

**Recommendation:** Add frame protection:
```php
header('X-Frame-Options: DENY');
```

---

### LOW-005: Missing X-Content-Type-Options Header

**Recommendation:** Add MIME type sniffing protection:
```php
header('X-Content-Type-Options: nosniff');
```

---

### LOW-006: Logging Sensitive Data

**File:** [`backend/app/Domains/Application/Http/Controllers/Teacher/StudentController.php`](backend/app/Domains/Application/Http/Controllers/Teacher/StudentController.php:143)  
**Issue:** Stack traces logged on student creation failure.

**Recommendation:** Sanitize logs in production.

---

### LOW-007: Missing Rate Limit Response Headers

**Recommendation:** Add `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers.

---

### LOW-008: Consider Adding Webhook Signature Verification

**Recommendation:** If using webhooks, implement signature verification.

---

## OWASP Top 10 2021 Mapping

| OWASP Category | Issues Found |
|----------------|--------------|
| A01:2021 – Broken Access Control | CVE-002, CVE-003, HIGH-002, MED-001 |
| A02:2021 – Cryptographic Failures | MED-002, MED-004 |
| A03:2021 – Injection | CVE-001, HIGH-005, HIGH-007 |
| A04:2021 – Insecure Design | MED-003 |
| A05:2021 – Security Misconfiguration | MED-005, MED-009, MED-010, LOW-001 |
| A07:2021 – Identification and Authentication Failures | HIGH-003, HIGH-004, HIGH-006, MED-006, MED-008, MED-011 |
| A08:2021 – Software and Data Integrity Failures | HIGH-001 |
| A09:2021 – Security Logging and Monitoring Failures | MED-007 |
| A10:2021 – Server-Side Request Forgery (SSRF) | None Found |

---

## Remediation Priority

### Immediate (Within 24 Hours)
1. **CVE-001:** Fix SQL injection in AcademyGradeService
2. **CVE-002:** Implement proper authorization in critical Form Requests
3. **CVE-003:** Create policies for authentication models

### High Priority (Within 1 Week)
4. **HIGH-001:** Review and restrict mass assignment fields
5. **HIGH-002:** Add ownership verification to all IDOR-prone endpoints
6. **HIGH-003:** Reduce refresh token lifetime
7. **HIGH-004:** Add rate limiting to sensitive endpoints

### Medium Priority (Within Sprint)
8. All MED-* issues

### Low Priority (When Possible)
9. All LOW-* issues

---

## Positive Security Findings

### ✅ Good Practices Observed

1. **Password Hashing:** All auth models use Laravel's `hashed` cast
2. **Token Management:** Proper access/refresh token separation
3. **Rate Limiting:** Implemented for login, video upload, and playback
4. **CORS:** Properly configured with specific origins
5. **File Storage:** Uses R2 with private visibility and presigned URLs
6. **Video Streaming:** Short-lived presigned URLs (45 seconds)
7. **Device Limits:** Implemented per user type
8. **UUID Primary Keys:** Used across models preventing enumeration
9. **Explicit $fillable:** No `$guarded = []` found
10. **Gate Authorization:** Used in VideoController with policies

---

## Conclusion

This Laravel 12 application has a solid foundation with many security best practices implemented. However, the critical issues around SQL injection and authorization bypass require immediate attention. The missing model policies represent a significant gap in the authorization layer that could lead to unauthorized data access.

### Recommended Next Steps

1. **Week 1:** Address all Critical and High-severity issues
2. **Week 2:** Implement missing policies for all 44 models
3. **Week 3:** Add comprehensive audit logging
4. **Week 4:** Security regression testing

---

*Report generated by Security Audit System*  
*Classification: Confidential*
