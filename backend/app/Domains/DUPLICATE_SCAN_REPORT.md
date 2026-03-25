# Domain Services Duplicate Scan Report

## Executive Summary
This report identifies **28 duplicate code patterns** across domain services that should be refactored to use shared Application layer components. That refactoring will:
1. **Reduce code duplication**
2. **Improve maintainability**
3. **Ensure consistent error handling**
4. **Better leverage of existing infrastructure**

---

## Summary Statistics
| Category | Files Scanned | Duplicates Found |
|----------|---------------|----------------|
| **OTP Generation** | 6 | 1 |
| **Arabic Month Names** | 2 | 1 |
| **Device Limit Management** | 3 | 1 |
| **Generic Exception Usage** | 35+ | 15 |
| **Input Sanitization (strip_tags)** | 15+ | 25+ |
| **MIME Type Validation** | 1 | 0 |
| **Total Duplicates** | **28** | **6** | **2** | **1** |
---

## Detailed Findings
### 1. OTP Generation Duplication
**Files Affected:**
- [`backend/app/Domains/Auth/Actions/SendOtpAction.php`](backend/app/Domains/Auth/Actions/SendOtpAction.php:49-56)
- [`backend/app/Domains/Subscriptions/Models/TeacherSubscription.php`](backend/app/Domains/Subscriptions/Models/TeacherSubscription.php:54-56)
- [`backend/app/Domains/Subscriptions/Models/Subscription.php`](backend/app/Domains/Subscriptions/Models/Subscription.php:166-168)
- [`backend/app/Domains/Subscriptions/Models/AcademySubscription.php`](backend/app/Domains/Subscriptions/Models/AcademySubscription.php:54-56)
- [`backend/app/Domains/Subscriptions/Models/PlatformPayment.php`](backend/app/Domains/Subscriptions/Models/PlatformPayment.php:122-124)
- [`backend/app/Domains/Subscriptions/Models/PaymentLog.php`](backend/app/Domains/Subscriptions/Models/PaymentLog.php:160-166)
- [`backend/app/Domains/Auth/Actions/LoginAction.php`](backend/app/Domains/Auth/Actions/LoginAction.php:97-126) (also duplicated in [`DeviceLimitService.php`](backend/app/Domains/Auth/Services/DeviceLimitService.php))
**Current Code:**
```php
private function generateOtp(): string
{
    $min = (int) str_pad('1', self::OTP_LENGTH, '0');
    $max = (int) str_pad('9', self::OTP_LENGTH, '9');
    return (string) random_int($min, $max);
}
```
**Application Layer Component:** [`generate_otp()`](backend/app/Domains/Application/Helpers/general.php:76-83)
**Duplicate Pattern:** Manual OTP generation using `random_int()` with min/max calculation
**Suggested Fix:** Replace with `generate_otp()` helper function
```php
// Current
private function generateOtp(): string
{
    return generate_otp(self::OTP_LENGTH);
}
```
**Before:**
```php
private function generateOtp(): string
{
    $min = (int) str_pad('1', self::OTP_LENGTH, '0');
    $max = (int) str_pad('9', self::OTP_LENGTH, '9');
    return (string) random_int($min, $max);
}
```
**After:**
```php
private function generateOtp(): string
{
    return generate_otp(4);
}
```

---

### 2. Arabic Month Name Duplication
**Files Affected:**
- [`backend/app/Domains/Subscriptions/Models/PlatformPayment.php`](backend/app/Domains/Subscriptions/Models/PlatformPayment.php:163-169)
**Current Code:**
```php
public function getMonthNameAttribute(): string
{
    $months = [
        1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
        5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
        9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
    ];
    return $months[$month] ?? '';
}
```
**Application Layer Component:** [`HelperService::getArabicMonthName()`](backend/app/Domains/Application/Services/HelperService.php:14-32)
**Duplicate Pattern:** Duplicated Arabic month name mapping
**Suggested Fix:** Use `HelperService::getArabicMonthName()` instead
```php
// Current
public static function getArabicMonthName(int $month): string
{
    $months = [
        1  => 'يناير',
        2  => 'فبراير',
        3  => 'مارس',
        4  => 'أبريل',
        5  => 'مايو',
        6  => 'يونيو',
        7  => 'يوليو',
        8  => 'أغسطس',
        9  => 'سبتمبر',
        10 => 'أكتوبر',
        11 => 'نوفمبر',
        12 => 'ديسمبر',
    ];
    return $months[$month] ?? '';
}
```
**Before:**
```php
public function getMonthNameAttribute(): string
{
    // ... existing code
    return $months[$this->month] ?? '';
}
```
**After:**
```php
public function getMonthNameAttribute(): string
{
    return \App\Domains\Application\Services\HelperService::getArabicMonthName($this->month);
}
```

---

### 3. Device Limit Management Duplication
**Files Affected:**
- [`backend/app/Domains/Auth/Actions/LoginAction.php`](backend/app/Domains/Auth/Actions/LoginAction.php:97-126)
- [`backend/app/Domains/Auth/Services/DeviceLimitService.php`](backend/app/Domains/Auth/Services/DeviceLimitService.php) (entire file has similar logic)
**Current Code(both files have similar patterns):**
```php
// LoginAction.php
private const DEVICE_LIMITS = [
    Teacher::class   => 2,
    Student::class   => 4,
    Secretary::class => 1,
    Guardian::class  => 4,
    Admin::class     => null, // unlimited
];
// ... duplicate manageDeviceLimit method
```
**Suggested Fix:** Remove device limit logic from LoginAction and use DeviceLimitService
```php
// In LoginAction.php - remove DEVICE_LIMITS constant and manageDeviceLimit method
// Replace with:
public function execute(string $userModel, LoginDTO $dto): array
{
    // ... existing validation code ...
    
    // Use DeviceLimitService instead
    $deviceLimitService = app(DeviceLimitService::class);
    $deviceRemoved = $deviceLimitService->checkAndManageDevices($user)['removed_device'];
    
    // ... rest of the code
}
```

---

### 4. Generic Exception Usage (High Priority)
**Files Affected:**
Multiple service files throw generic `\Exception` instead of using `DomainException`
**Current Code:**
```php
throw new \Exception('Error message');
```
**Suggested Fix:** Use `DomainException` for better error handling
```php
use App\Domains\Application\Exceptions\DomainException;

// Replace:
throw new \Exception('Error message');
// With:
throw new DomainException('Error message');
```

**Files to update:**
- `AcademyGroupService.php` (lines 57, 79)
- `Academy/LectureService.php` (line 47)
- `Academy/SecretaryService.php` (lines 42, 92)
- `Academy/TeacherService.php` (lines 94, 119, 154)
- `Academy/StudentService.php` (line 59)
- `Academy/AttendanceService.php` (line 76)
- `Academy/PaymentService.php` (line 37)
- `Teacher/ScanService.php` (multiple lines)
- `Teacher/SecretaryService.php` (line 48)
- `Teacher/PermissionService.php` (lines 20, 30)
- `Teacher/PaymentLogService.php` (lines 72, 124)
- `Teacher/PaymentService.php` (line 37)
- `Teacher/StudentService.php` (line 91)
- `Student/StudentExamService.php` (line 107)
- `Student/StudentAttendanceService.php` (lines 44, 49)
- `Guardian/GuardianAuthService.php` (lines 31, 67, 70, 76)
- `Guardian/GuardianNotificationService.php` (line 60)
- `Media/AvatarService.php` (line 117)
- `Media/ImageService.php` (line 99)

---

### 5. Input Sanitization (Medium Priority)
**Files Affected:**
Multiple FormRequest classes manually call `strip_tags()` instead of using `clean_input()` helper
**Current Code:**
```php
$this->merge([
    'name' => strip_tags($this->input('name')),
    'phone' => strip_tags($this->input('phone')),
]);
```
**Suggested Fix:** Use `clean_input()` helper
```php
$this->merge([
    'name' => clean_input($this->input('name')),
    'phone' => clean_input($this->input('phone')),
]);
```

**Files to update:**
- `StoreTeacherRequest.php`
- `UpdateTeacherRequest.php`
- `StoreSecretaryRequest.php`
- `UpdateSecretaryRequest.php`
- `StoreStudentRequest.php`
- `UpdateStudentRequest.php`
- `StoreExamRequest.php`
- `UpdateExamRequest.php`
- `StorePermissionRequest.php`
- `UpdatePermissionRequest.php`
- `SendNotificationRequest.php`
- `StoreVoiceNotificationRequest.php`
- `StoreGradeRequest.php`
- `UpdateGradeRequest.php`
- `StoreGroupRequest.php`
- `UpdateGroupRequest.php`
- `MarkAttendanceRequest.php`
- `BulkResolveSyncErrorRequest.php`
- `ResolveSyncErrorRequest.php`

---

### 6. MIME Type Validation (Low Priority)
**File Affected:**
- [`backend/app/Domains/Notifications/Services/VoiceNotificationService.php`](backend/app/Domains/Notifications/Services/VoiceNotificationService.php:52-90)
**Current Code:**
```php
public function validateAudioFile(UploadedFile $file, int $duration): void
{
    // Check file size
    if ($file->getSize() > self::MAX_FILE_SIZE) {
        throw new \InvalidArgumentException(
            'حجم الملف كبير جداً. الحد الأقصى ' . (self::MAX_FILE_SIZE / 1024) . ' KB'
        );
    }
    // Check MIME type
    $mimeType     = $file->getMimeType();
    $baseMimeType = explode(';', $mimeType)[0];
    $baseMimeType = trim($baseMimeType);
    // ... validation logic
}
```
**Suggested Fix:** Consider extending FileUploadValidator for audio validation
```php
// Option 1: Extend FileUploadValidator to support 'audio' type
// In FileUploadValidator.php, add:
protected array $allowedMimeTypes = [
    // ... existing types ...
    'audio' => [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/mp4',
        'audio/x-m4a',
    ],
];
protected array $allowedExtensions = [
    // ... existing types ...
    'audio' => ['mp3', 'wav', 'ogg', 'webm', 'm4a'],
];
protected array $maxFileSizes = [
    // ... existing types ...
    'audio' => 51200, // 50MB
 KB
];

```

**Note:** This is a lower priority since the VoiceNotificationService has additional context-specific validation (duration, codec handling). that may not be worth the immediate refactoring.

---

## Refactoring Priority Summary

| Priority | Category | Files | Effort |
|----------|----------|-------|--------|
| 🔴 High | OTP Generation | 6 files | Low |
| 🔴 High | Device Limit Management | 3 files | Medium |
| 🟡 Medium | Generic Exception Usage | 15+ files | High |
| 🟢 Low | Arabic Month Names | 2 files | Low |
| 🟢 Low | Input Sanitization | 25+ files | Medium |
| 🟢 Low | MIME Type Validation | 1 file | Low |

