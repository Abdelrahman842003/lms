---
title: Enrollment Enums
description: Enumeration types for the Enrollments domain including enrollment status, group types, seat status, and student activity actions
---

# Enrollment Enums

[Back to Enums Index](./)

All enums are located in the `App\Domains\Enrollments\Enums` namespace.

---

## EnrollmentStatus

Defines student enrollment status.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `ACTIVE` | `active` | نشط | Enrollment is active |
| `SUSPENDED` | `suspended` | موقوف | Enrollment suspended |
| `EXPIRED` | `expired` | منتهي | Enrollment expired |
| `BLOCKED_BY_PLAN` | `blocked_by_plan` | محظور بسبب الباقة | Blocked by subscription plan |

**Methods:**
- `label(): string` - Returns Arabic label
- `isActive(): bool` - Returns true if enrollment is active

**Usage:**
```php
use App\Domains\Enrollments\Enums\EnrollmentStatus;

$status = EnrollmentStatus::ACTIVE;
echo $status->value;    // 'active'
echo $status->label();  // 'نشط'
echo $status->isActive(); // true
```

**Location:** `App\Domains\Enrollments\Enums\EnrollmentStatus`

---

## GroupType

Defines group visibility type.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `PUBLIC` | `public` | عام | Public group visible to all |
| `PRIVATE` | `private` | خاص | Private group with restricted access |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Enrollments\Enums\GroupType;

$type = GroupType::PRIVATE;
echo $type->value;  // 'private'
echo $type->label(); // 'خاص'
```

**Location:** `App\Domains\Enrollments\Enums\GroupType`

---

## SeatStatus

Defines seat allocation status.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `ACTIVE` | `active` | نشط | Seat is actively allocated |
| `SUSPENDED` | `suspended` | موقوف | Seat allocation suspended |
| `RELEASED` | `released` | محرر | Seat has been released |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Enrollments\Enums\SeatStatus;

$status = SeatStatus::ACTIVE;
echo $status->value;  // 'active'
echo $status->label(); // 'نشط'
```

**Location:** `App\Domains\Enrollments\Enums\SeatStatus`

---

## StudentActivityAction

Defines types of student activity log actions.

| Case | Value | Description |
|------|-------|-------------|
| `ENROLLED` | `enrolled` | Student enrolled |
| `UNENROLLED` | `unenrolled` | Student unenrolled |
| `GROUP_CHANGE` | `group_change` | Group changed |
| `GRADE_CHANGE` | `grade_change` | Grade changed |
| `PAYMENT` | `payment` | Payment recorded |
| `DEDUCTION` | `deduction` | Deduction applied |
| `MERGED` | `merged` | Student merged |
| `STATUS_CHANGE` | `status_change` | Status changed |

**Usage:**
```php
use App\Domains\Enrollments\Enums\StudentActivityAction;

$action = StudentActivityAction::ENROLLED;
echo $action->value; // 'enrolled'
```

**Location:** `App\Domains\Enrollments\Enums\StudentActivityAction`
