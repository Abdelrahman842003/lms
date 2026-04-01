---
title: Subscriptions Domain
description: Subscription management, payment plans, seat limits, and expiration handling
---

# Subscriptions Domain

**Path:** `backend/app/Domains/Subscriptions/`

The Subscriptions domain handles subscription lifecycle management, payment tracking, seat limits, and automatic enrollment suspension on expiry.

## Overview

```mermaid
flowchart TB
    subgraph Models["Models"]
        Subscription["Subscription"]
        PaymentLog["PaymentLog"]
        TeacherSubscription["TeacherSubscription"]
        AcademySubscription["AcademySubscription"]
    end
    
    subgraph Events["Events"]
        SubscriptionExpired["SubscriptionExpired"]
        SubscriptionExpiringSoon["SubscriptionExpiringSoon"]
    end
    
    subgraph Jobs["Jobs"]
        CheckExpiring["CheckExpiringSubscriptions"]
        ProcessExpired["ProcessExpiredSubscriptions"]
    end
    
    subgraph Specifications["Specifications"]
        PlanActive["PlanActive"]
        SeatAvailable["SeatAvailable"]
    end
    
    subgraph Listeners["Listeners"]
        SuspendEnrollments["SuspendEnrollmentsOnExpiry"]
    end
    
    Subscription --> PaymentLog
    Subscription --> TeacherSubscription
    Subscription --> AcademySubscription
    SubscriptionExpired --> SuspendEnrollments
```

## Enums

### SubscriptionStatus

**File:** `Subscriptions/Enums/SubscriptionStatus.php`

```php
enum SubscriptionStatus: string
{
    case ACTIVE    = 'active';
    case PENDING   = 'pending';
    case PARTIAL   = 'partial';
    case PAID      = 'paid';
    case EXPIRED   = 'expired';
    case CANCELLED = 'cancelled';
    
    public function label(): string
    {
        return match($this) {
            self::ACTIVE    => 'نشط',
            self::PENDING   => 'غير مدفوع',
            self::PARTIAL   => 'مدفوع جزئياً',
            self::PAID      => 'مدفوع',
            self::EXPIRED   => 'منتهي',
            self::CANCELLED => 'ملغي',
        };
    }
    
    public function color(): string
    {
        return match($this) {
            self::ACTIVE    => 'success',
            self::PENDING   => 'warning',
            self::PARTIAL   => 'info',
            self::PAID      => 'success',
            self::EXPIRED   => 'danger',
            self::CANCELLED => 'secondary',
        };
    }
}
```

| Case | Value | Arabic Label | Color |
|------|-------|--------------|-------|
| `ACTIVE` | `active` | نشط | success |
| `PENDING` | `pending` | غير مدفوع | warning |
| `PARTIAL` | `partial` | مدفوع جزئياً | info |
| `PAID` | `paid` | مدفوع | success |
| `EXPIRED` | `expired` | منتهي | danger |
| `CANCELLED` | `cancelled` | ملغي | secondary |

---

### PaymentMethod

**File:** `Subscriptions/Enums/PaymentMethod.php`

```php
enum PaymentMethod: string
{
    case ADMIN = 'admin';
    case CASH = 'cash';
    case BANK_TRANSFER = 'bank_transfer';
    case CARD = 'card';
}
```

---

### PaymentLogStatus

**File:** `Subscriptions/Enums/PaymentLogStatus.php`

```php
enum PaymentLogStatus: string
{
    case PENDING   = 'pending';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case EXPIRED   = 'expired';
}
```

---

### PaymentPriceSource

**File:** `Subscriptions/Enums/PaymentPriceSource.php`

```php
enum PaymentPriceSource: string
{
    case MANUAL     = 'manual';
    case CALCULATED = 'calculated';
    case DISCOUNTED = 'discounted';
}
```

---

### PeriodType

**File:** `Subscriptions/Enums/PeriodType.php`

```php
enum PeriodType: string
{
    case MONTHLY   = 'monthly';
    case QUARTERLY = 'quarterly';
    case YEARLY    = 'yearly';
}
```

---

### SubscriptionType

**File:** `Subscriptions/Enums/SubscriptionType.php`

```php
enum SubscriptionType: string
{
    case TEACHER = 'teacher';
    case ACADEMY = 'academy';
}
```

---

### TeacherSubscriptionStatus

**File:** `Subscriptions/Enums/TeacherSubscriptionStatus.php`

```php
enum TeacherSubscriptionStatus: string
{
    case TRIAL     = 'trial';
    case ACTIVE    = 'active';
    case EXPIRED   = 'expired';
    case SUSPENDED = 'suspended';
}
```

---

## Events

### SubscriptionExpired

**File:** `Subscriptions/Events/SubscriptionExpired.php`

```php
class SubscriptionExpired
{
    public function __construct(
        public string $subscriptionId,
        public string $subscriberType,
        public string $subscriberId,
    ) {}
}
```

**Listeners:**
- `SuspendEnrollmentsOnExpiry` - Suspends all active enrollments

---

### SubscriptionExpiringSoon

**File:** `Subscriptions/Events/SubscriptionExpiringSoon.php`

```php
class SubscriptionExpiringSoon
{
    public function __construct(
        public string $subscriptionId,
        public string $subscriberType,
        public string $subscriberId,
        public int $daysUntilExpiry,
    ) {}
}
```

**Listeners:**
- Send notification to subscriber
- Send notification to admin

---

## Jobs

### CheckExpiringSubscriptions

**File:** `Subscriptions/Jobs/CheckExpiringSubscriptions.php`

Runs daily to check for subscriptions expiring soon.

```php
class CheckExpiringSubscriptions implements ShouldQueue
{
    public function handle(): void
    {
        // Find subscriptions expiring in next 7 days
        $expiringSoon = Subscription::whereBetween('expires_at', [now(), now()->addDays(7)])
            ->where('status', SubscriptionStatus::ACTIVE)
            ->get();
        
        foreach ($expiringSoon as $subscription) {
            event(new SubscriptionExpiringSoon(
                $subscription->id,
                $subscription->subscriber_type,
                $subscription->subscriber_id,
                now()->diffInDays($subscription->expires_at)
            ));
        }
    }
}
```

---

### ProcessExpiredSubscriptions

**File:** `Subscriptions/Jobs/ProcessExpiredSubscriptions.php`

Processes subscriptions that have expired.

```php
class ProcessExpiredSubscriptions implements ShouldQueue
{
    public function handle(): void
    {
        $expired = Subscription::where('expires_at', '<', now())
            ->whereIn('status', [SubscriptionStatus::ACTIVE, SubscriptionStatus::PENDING])
            ->get();
        
        foreach ($expired as $subscription) {
            $subscription->update(['status' => SubscriptionStatus::EXPIRED]);
            
            event(new SubscriptionExpired(
                $subscription->id,
                $subscription->subscriber_type,
                $subscription->subscriber_id
            ));
        }
    }
}
```

---

## Specifications

### Specification Pattern

The Subscriptions domain implements the **Specification Pattern** with composable business rules.

#### SpecificationInterface

```php
interface SpecificationInterface
{
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool;
    public function and(SpecificationInterface $other): SpecificationInterface;
    public function or(SpecificationInterface $other): SpecificationInterface;
    public function not(): SpecificationInterface;
}
```

#### Composite Specifications

| Specification | Logic | Use Case |
|--------------|-------|----------|
| `AndSpecification` | Both must be satisfied | Active AND seats available |
| `OrSpecification` | Either must be satisfied | Trial OR paid subscription |
| `NotSpecification` | Negation | NOT expired |

```php
// Compose complex business rules
$canEnroll = (new PlanActive())
    ->and(new SeatAvailable())
    ->and((new SubscriptionCanRenew())->not());

if ($canEnroll->isSatisfiedBy($subscription)) {
    // Allow enrollment
}
```

---

### PlanActive

**File:** `Subscriptions/Specifications/PlanActive.php`

Business rule specification for checking if subscription plan is active.

```php
class PlanActive
{
    public function isSatisfied(Subscription $subscription): bool
    {
        return in_array($subscription->status, [
            SubscriptionStatus::ACTIVE,
            SubscriptionStatus::PAID,
        ]);
    }
}
```

---

### SeatAvailable

**File:** `Subscriptions/Specifications/SeatAvailable.php`

Checks if seat is available for new enrollment.

```php
class SeatAvailable
{
    public function isSatisfied(Subscription $subscription): bool
    {
        $usedSeats = Enrollment::where('teacher_id', $subscription->subscriber_id)
            ->where('is_active', true)
            ->count();
        
        return $usedSeats < $subscription->max_seats;
    }
}
```

---

### SubscriptionCanRenew

**File:** `Subscriptions/Specifications/SubscriptionCanRenew.php`

Validates renewal eligibility with grace period check, pending renewal check, and quota validation.

```php
class SubscriptionCanRenew extends AbstractSpecification
{
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        // 1. Grace period check (3 days after expiry)
        // 2. No pending renewal check
        // 3. Quota validation
    }
}
```

---

## Plan Classes

### PlanInterface

**File:** `Subscriptions/Plans/PlanInterface.php`

```php
interface PlanInterface
{
    public function getName(): string;
    public function getLabel(): string;
    public function getMonths(): int;
    public function getTrialDays(): int;
    public function isTrial(): bool;
    public function isCustom(): bool;
    public function calculateAmount(float $pricePerStudent, int $studentCount): float;
    public function getEndDate(Carbon $startDate): Carbon;
    public function buildNotes(float $price, int $studentCount): string;
}
```

### Available Plans

| Plan | Duration | Trial Days | Use Case |
|------|----------|-----------|----------|
| **MonthlyPlan** | 1 month | 0 | Monthly subscription |
| **QuarterlyPlan** | 3 months | 0 | Quarterly subscription |
| **SemiAnnualPlan** | 6 months | 0 | Semi-annual subscription |
| **AnnualPlan** | 12 months | 0 | Annual subscription |
| **TrialPlan** | Configurable (default 14 days) | Configurable | Free trial period |
| **CustomPlan** | User-defined | 0 | Custom duration |

```mermaid
classDiagram
    class PlanInterface {
        <<interface>>
        +getName() string
        +getLabel() string
        +getMonths() int
        +calculateAmount() float
        +getEndDate() Carbon
    }
    class AbstractPlan {
        +calculateAmount() float
        +getEndDate() Carbon
        +buildNotes() string
    }
    class MonthlyPlan { +getMonths() 1 }
    class QuarterlyPlan { +getMonths() 3 }
    class SemiAnnualPlan { +getMonths() 6 }
    class AnnualPlan { +getMonths() 12 }
    class TrialPlan { +isTrial() true }
    class CustomPlan { +isCustom() true }

    PlanInterface <|.. AbstractPlan
    AbstractPlan <|-- MonthlyPlan
    AbstractPlan <|-- QuarterlyPlan
    AbstractPlan <|-- SemiAnnualPlan
    AbstractPlan <|-- AnnualPlan
    AbstractPlan <|-- TrialPlan
    AbstractPlan <|-- CustomPlan
```

### PlanFactory

**File:** `Subscriptions/Plans/PlanFactory.php`

```php
class PlanFactory
{
    public function create(string $planName): PlanInterface
    public function createTrial(int $days = 14): TrialPlan
    public function createMonthly(): MonthlyPlan
    public function createQuarterly(): QuarterlyPlan
    public function createSemiAnnual(): SemiAnnualPlan
    public function createAnnual(): AnnualPlan
    public function getPlanOptions(): array  // For form select dropdowns
}
```

---

## Traits

### HasSubscriptionStatus

**File:** `Subscriptions/Traits/HasSubscriptionStatus.php`

Used by `Teacher` and `Academy` models to check subscription status.

```php
trait HasSubscriptionStatus
{
    public function hasActiveSubscription(): bool
    {
        $latestSubscription = $this->subscriptions()
            ->latest()
            ->first();

        if (!$latestSubscription) {
            return false;
        }

        return in_array($latestSubscription->status, [
            SubscriptionStatus::ACTIVE,
            SubscriptionStatus::PAID,
        ]) && (!$latestSubscription->expires_at || $latestSubscription->expires_at->isFuture());
    }

    public function isSubscriptionBlocked(): bool
    {
        return !$this->hasActiveSubscription();
    }
}
```

---

## Listeners

### SuspendEnrollmentsOnExpiry

**File:** `Subscriptions/Listeners/SuspendEnrollmentsOnExpiry.php`

```php
class SuspendEnrollmentsOnExpiry
{
    public function handle(SubscriptionExpired $event): void
    {
        if ($event->subscriberType === 'teacher') {
            Enrollment::where('teacher_id', $event->subscriberId)
                ->where('is_active', true)
                ->update([
                    'is_active' => false,
                    'status' => EnrollmentStatus::BLOCKED_BY_PLAN,
                ]);
        }
    }
}
```

---

## DTOs

### PaymentData

**File:** `Subscriptions/DTOs/PaymentData.php`

```php
class PaymentData
{
    public function __construct(
        public float $amount,
        public string $subscriptionId,
        public PaymentMethod $method,
        public ?string $reference = null,
        public ?array $metadata = null,
    ) {}
}
```

---

### TeacherPaymentData

**File:** `Subscriptions/DTOs/TeacherPaymentData.php`

```php
class TeacherPaymentData
{
    public function __construct(
        public string $teacherId,
        public float $amount,
        public PeriodType $periodType,
        public ?string $planName = null,
        public ?float $discount = null,
    ) {}
}
```

---

## Exceptions

### QuotaExceededException

**File:** `Subscriptions/Exceptions/QuotaExceededException.php`

Thrown when subscription quota is exceeded.

```php
class QuotaExceededException extends DomainException
{
    public function __construct(string $message = 'Subscription quota exceeded')
    {
        parent::__construct($message);
    }
}
```

---

## Usage Examples

### Checking Subscription Status

```php
use App\Domains\Subscriptions\Specifications\PlanActive;

$isPlanActive = (new PlanActive())->isSatisfied($subscription);

if (!$isPlanActive) {
    throw new QuotaExceededException('Subscription is not active');
}
```

### Checking Seat Availability

```php
use App\Domains\Subscriptions\Specifications\SeatAvailable;

$hasSeat = (new SeatAvailable())->isSatisfied($subscription);

if (!$hasSeat) {
    throw new QuotaExceededException('No seats available in subscription');
}
```

### Processing Payment

```php
use App\Domains\Subscriptions\DTOs\PaymentData;
use App\Domains\Subscriptions\Enums\PaymentMethod;

$paymentData = new PaymentData(
    amount: 100.00,
    subscriptionId: $subscription->id,
    method: PaymentMethod::CASH,
);

// Create payment log
PaymentLog::create([
    'subscription_id' => $paymentData->subscriptionId,
    'amount' => $paymentData->amount,
    'method' => $paymentData->method,
    'status' => PaymentLogStatus::COMPLETED,
]);
```

---

## Database Tables

### subscriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subscriber_type` | string | Polymorphic type |
| `subscriber_id` | UUID | Polymorphic ID |
| `plan_name` | string | Plan name |
| `status` | enum | Subscription status |
| `amount` | decimal | Total amount |
| `paid_amount` | decimal | Amount paid |
| `max_seats` | int | Maximum seats |
| `starts_at` | timestamp | Start date |
| `expires_at` | timestamp | Expiry date |
| `period_type` | enum | Period type |

---

### teacher_subscriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `teacher_id` | UUID | FK to teachers |
| `plan_name` | string | Plan name |
| `status` | enum | Status |
| `max_students` | int | Max students |
| `starts_at` | timestamp | Start date |
| `expires_at` | timestamp | Expiry date |

---

### academy_subscriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `academy_id` | UUID | FK to academies |
| `plan_name` | string | Plan name |
| `status` | enum | Status |
| `max_teachers` | int | Max teachers |
| `max_students` | int | Max students |
| `starts_at` | timestamp | Start date |
| `expires_at` | timestamp | Expiry date |

---

### payment_logs

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subscription_id` | UUID | FK to subscriptions |
| `amount` | decimal | Payment amount |
| `method` | enum | Payment method |
| `status` | enum | Payment status |
| `reference` | string | Payment reference |
| `paid_at` | timestamp | Payment date |

---

## References

- [`backend/app/Domains/Subscriptions/`](/backend/app/Domains/Subscriptions/) - Source code
- [Enrollments Domain](/backend/domains/enrollments) - Enrollment management
- [Auth Domain](/backend/domains/auth) - Teacher/Academy models

## Related Domains

- [Auth Domain](/backend/domains/auth) - Teacher and Academy models
- [Enrollments Domain](/backend/domains/enrollments) - Enrollment suspension
- [Notifications Domain](/backend/domains/notifications) - Subscription notifications
