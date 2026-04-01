---
title: Subscription Enums
description: Enumeration types for the Subscriptions domain including subscription status, payment methods, period types, and pricing
---

# Subscription Enums

[Back to Enums Index](./)

All enums are located in the `App\Domains\Subscriptions\Enums` namespace.

---

## SubscriptionStatus

Defines subscription lifecycle status.

| Case | Value | Label (AR) | Color | Description |
|------|-------|------------|-------|-------------|
| `ACTIVE` | `active` | نشط | success | Subscription is active |
| `PENDING` | `pending` | غير مدفوع | warning | Awaiting payment |
| `PARTIAL` | `partial` | مدفوع جزئياً | info | Partially paid |
| `PAID` | `paid` | مدفوع | success | Fully paid |
| `EXPIRED` | `expired` | منتهي | danger | Subscription expired |
| `CANCELLED` | `cancelled` | ملغي | secondary | Subscription cancelled |

**Methods:**
- `label(): string` - Returns Arabic label
- `color(): string` - Returns UI color class

**Usage:**
```php
use App\Domains\Subscriptions\Enums\SubscriptionStatus;

$status = SubscriptionStatus::ACTIVE;
echo $status->value;  // 'active'
echo $status->label(); // 'نشط'
echo $status->color(); // 'success'
```

**Location:** `App\Domains\Subscriptions\Enums\SubscriptionStatus`

---

## SubscriptionType

Defines types of subscriptions.

| Case | Value | Label (AR) | Price Setting Key | Description |
|------|-------|------------|-------------------|-------------|
| `TEACHER` | `teacher` | مدرس | `pricePerStudent` | Individual teacher subscription |
| `ACADEMY` | `academy` | أكاديمية | `academy_student_price` | Academy/institution subscription |

**Methods:**
- `label(): string` - Returns Arabic label
- `priceSettingKey(): string` - Returns the setting key for price

**Usage:**
```php
use App\Domains\Subscriptions\Enums\SubscriptionType;

$type = SubscriptionType::TEACHER;
echo $type->value;            // 'teacher'
echo $type->label();          // 'مدرس'
echo $type->priceSettingKey(); // 'pricePerStudent'
```

**Location:** `App\Domains\Subscriptions\Enums\SubscriptionType`

---

## PaymentMethod

Defines available payment methods.

| Case | Value | Description |
|------|-------|-------------|
| `ADMIN` | `admin` | Admin-recorded payment |

**Usage:**
```php
use App\Domains\Subscriptions\Enums\PaymentMethod;

$method = PaymentMethod::ADMIN;
echo $method->value; // 'admin'
```

**Location:** `App\Domains\Subscriptions\Enums\PaymentMethod`

---

## PaymentLogStatus

Defines payment log status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING` | `pending` | Payment pending |
| `CONFIRMED` | `confirmed` | Payment confirmed |
| `EXPIRED` | `expired` | Payment expired |
| `CANCELLED` | `cancelled` | Payment cancelled |

**Usage:**
```php
use App\Domains\Subscriptions\Enums\PaymentLogStatus;

$status = PaymentLogStatus::CONFIRMED;
echo $status->value; // 'confirmed'
```

**Location:** `App\Domains\Subscriptions\Enums\PaymentLogStatus`

---

## TeacherSubscriptionStatus

Defines teacher-specific subscription status.

| Case | Value | Description |
|------|-------|-------------|
| `PENDING` | `pending` | Payment pending |
| `PARTIAL` | `partial` | Partially paid |
| `PAID` | `paid` | Fully paid |

**Usage:**
```php
use App\Domains\Subscriptions\Enums\TeacherSubscriptionStatus;

$status = TeacherSubscriptionStatus::PAID;
echo $status->value; // 'paid'
```

**Location:** `App\Domains\Subscriptions\Enums\TeacherSubscriptionStatus`

---

## PeriodType

Defines billing period types.

| Case | Value | Label (AR) | Description |
|------|-------|------------|-------------|
| `MONTHLY` | `monthly` | شهري | Monthly billing cycle |
| `YEARLY` | `yearly` | سنوي | Yearly billing cycle |
| `ONE_TIME` | `one_time` | مرة واحدة | One-time payment |
| `CUSTOM` | `custom` | مخصص | Custom billing period |

**Methods:**
- `label(): string` - Returns Arabic label

**Usage:**
```php
use App\Domains\Subscriptions\Enums\PeriodType;

$period = PeriodType::MONTHLY;
echo $period->value;  // 'monthly'
echo $period->label(); // 'شهري'
```

**Location:** `App\Domains\Subscriptions\Enums\PeriodType`

---

## PaymentPriceSource

Defines where payment price is derived from.

| Case | Value | Description |
|------|-------|-------------|
| `GRADE` | `grade` | Price from grade settings |
| `GROUP` | `group` | Price from group settings |

**Usage:**
```php
use App\Domains\Subscriptions\Enums\PaymentPriceSource;

$source = PaymentPriceSource::GRADE;
echo $source->value; // 'grade'
```

**Location:** `App\Domains\Subscriptions\Enums\PaymentPriceSource`
