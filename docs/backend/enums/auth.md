---
title: Auth Enums
description: Enumeration types for the Auth domain including user roles, teacher status, student gender, organization types, and reporting enums
---

# Auth Enums

[Back to Enums Index](./)

All enums are located in the `App\Domains\Auth\Enums` namespace unless otherwise noted. Reporting enums are located in `App\Domains\Reporting\Domain\Enums`.

---

## UserRole

Defines user roles in the system.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `SUPER_ADMIN` | `super_admin` | مدير النظام | System administrator with full access |
| `ADMIN` | `admin` | مشرف | Supervisor with management access |
| `ORG_ADMIN` | `org_admin` | مدير المنظمة | Organization administrator |
| `TEACHER` | `teacher` | مدرس | Teacher/instructor |
| `SECRETARY` | `secretary` | سكرتير | Secretary assistant |
| `STUDENT` | `student` | طالب | Student |
| `PARENT` | `parent` | ولي أمر | Parent/Guardian |

**Methods:**
- `label(): string` - Returns Arabic label
- `isManagementRole(): bool` - Returns true for roles that can manage content (SUPER_ADMIN, ADMIN, ORG_ADMIN, TEACHER, SECRETARY)

**Usage:**
```php
use App\Domains\Auth\Enums\UserRole;

$role = UserRole::TEACHER;
echo $role->value;             // 'teacher'
echo $role->label();           // 'مدرس'
echo $role->isManagementRole(); // true
```

**Location:** `App\Domains\Auth\Enums\UserRole`

---

## TeacherStatus

Defines the status of a teacher account.

| Case | Value | Description |
|------|-------|-------------|
| `ACTIVE` | `active` | Teacher is active and can access the system |
| `SUSPENDED` | `suspended` | Teacher account is suspended |
| `PENDING` | `pending` | Teacher registration pending approval |

**Usage:**
```php
use App\Domains\Auth\Enums\TeacherStatus;

$status = TeacherStatus::ACTIVE;
echo $status->value; // 'active'
```

**Location:** `App\Domains\Auth\Enums\TeacherStatus`

---

## StudentGender

Defines student gender for grouping purposes.

| Case | Value | Description |
|------|-------|-------------|
| `MALE` | `male` | Male student |
| `FEMALE` | `female` | Female student |

**Usage:**
```php
use App\Domains\Auth\Enums\StudentGender;

$gender = StudentGender::MALE;
echo $gender->value; // 'male'
```

**Location:** `App\Domains\Auth\Enums\StudentGender`

---

## TeacherAttendanceStatus

Defines teacher check-in/check-out status.

| Case | Value | Description |
|------|-------|-------------|
| `CHECKED_IN` | `checked_in` | Teacher has checked in |
| `CHECKED_OUT` | `checked_out` | Teacher has checked out |
| `ABSENT` | `absent` | Teacher is absent |

**Usage:**
```php
use App\Domains\Auth\Enums\TeacherAttendanceStatus;

$status = TeacherAttendanceStatus::CHECKED_IN;
echo $status->value; // 'checked_in'
```

**Location:** `App\Domains\Auth\Enums\TeacherAttendanceStatus`

---

## OrganizationType

Defines types of organizations.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `ACADEMY` | `academy` | مركز تعليمي | Educational center |
| `PRIVATE_SCHOOL` | `private_school` | مدرسة خاصة | Private school |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Auth\Enums\OrganizationType;

$type = OrganizationType::ACADEMY;
echo $type->value; // 'academy'
echo $type->label(); // 'مركز تعليمي'
```

**Location:** `App\Domains\Auth\Enums\OrganizationType`

---

## StudentEducationType

Defines the type of education system.

| Case | Value | Description |
|------|-------|-------------|
| `GENERAL` | `general` | General education system |
| `AZHAR` | `azhar` | Al-Azhar education system |

**Usage:**
```php
use App\Domains\Auth\Enums\StudentEducationType;

$edu = StudentEducationType::GENERAL;
echo $edu->value; // 'general'
```

**Location:** `App\Domains\Auth\Enums\StudentEducationType`

---

## DeviceType

Defines device types for FCM notifications.

| Case | Value | Description |
|------|-------|-------------|
| `ANDROID` | `android` | Android device |
| `IOS` | `ios` | iOS device |
| `WEB` | `web` | Web browser |

**Usage:**
```php
use App\Domains\Auth\Enums\DeviceType;

$device = DeviceType::WEB;
echo $device->value; // 'web'
```

**Location:** `App\Domains\Auth\Enums\DeviceType`

---

## Reporting Enums

The following enums are part of the Reporting domain (`App\Domains\Reporting\Domain\Enums`) and are documented here alongside Auth enums since they relate to analytics and user activity monitoring.

### AlertSeverity

Defines severity levels for report alerts.

| Case | Value | Label | Color | Description |
|------|-------|-------|-------|-------------|
| `Info` | `info` | Info | blue | Informational alert |
| `Warning` | `warning` | Warning | yellow | Warning-level alert |
| `Critical` | `critical` | Critical | red | Critical alert requiring immediate attention |

**Methods:**
- `label(): string` - Returns display label
- `color(): string` - Returns UI color
- `priority(): int` - Returns sort priority (1 = highest)

**Usage:**
```php
use App\Domains\Reporting\Domain\Enums\AlertSeverity;

$severity = AlertSeverity::Critical;
echo $severity->value;    // 'critical'
echo $severity->label();  // 'Critical'
echo $severity->color();  // 'red'
echo $severity->priority(); // 1
```

**Location:** `App\Domains\Reporting\Domain\Enums\AlertSeverity`

---

### ComparisonMode

Defines how report periods are compared.

| Case | Value | Label | Description |
|------|-------|-------|-------------|
| `PreviousPeriod` | `previous_period` | Previous Period | Compare with the immediately preceding period |
| `SamePeriodLastYear` | `same_period_last_year` | Same Period Last Year | Compare with the same period in the previous year |

**Methods:**
- `label(): string` - Returns display label

**Usage:**
```php
use App\Domains\Reporting\Domain\Enums\ComparisonMode;

$mode = ComparisonMode::PreviousPeriod;
echo $mode->value; // 'previous_period'
echo $mode->label(); // 'Previous Period'
```

**Location:** `App\Domains\Reporting\Domain\Enums\ComparisonMode`

---

### Direction

Defines trend direction for metric comparisons.

| Case | Value | Label | Color | Description |
|------|-------|-------|-------|-------------|
| `Up` | `up` | Up | green | Metric is trending upward |
| `Down` | `down` | Down | red | Metric is trending downward |
| `Stable` | `stable` | Stable | gray | Metric is unchanged |

**Methods:**
- `label(): string` - Returns display label
- `color(): string` - Returns UI color

**Usage:**
```php
use App\Domains\Reporting\Domain\Enums\Direction;

$dir = Direction::Up;
echo $dir->value; // 'up'
echo $dir->color(); // 'green'
```

**Location:** `App\Domains\Reporting\Domain\Enums\Direction`

---

### GranularityHint

Defines time granularity for report data points.

| Case | Value | Label | Description |
|------|-------|-------|-------------|
| `Day` | `day` | Day | Daily granularity |
| `Week` | `week` | Week | Weekly granularity |
| `Month` | `month` | Month | Monthly granularity |

**Methods:**
- `label(): string` - Returns display label

**Usage:**
```php
use App\Domains\Reporting\Domain\Enums\GranularityHint;

$granularity = GranularityHint::Month;
echo $granularity->value; // 'month'
```

**Location:** `App\Domains\Reporting\Domain\Enums\GranularityHint`

---

### ReportingPeriodPreset

Defines preset time ranges for report filtering.

| Case | Value | Label | Description |
|------|-------|-------|-------------|
| `Today` | `today` | Today | Current day |
| `Last7Days` | `last_7_days` | Last 7 Days | Rolling 7-day window |
| `ThisMonth` | `this_month` | This Month | Current calendar month |
| `LastMonth` | `last_month` | Last Month | Previous calendar month |
| `Last3Months` | `last_3_months` | Last 3 Months | Rolling 3-month window |
| `ThisYear` | `this_year` | This Year | Current calendar year |
| `CustomRange` | `custom_range` | Custom Range | User-specified start and end dates |

**Methods:**
- `label(): string` - Returns display label

**Usage:**
```php
use App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset;

$preset = ReportingPeriodPreset::Last3Months;
echo $preset->value; // 'last_3_months'
echo $preset->label(); // 'Last 3 Months'
```

**Location:** `App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset`
