# Design Pattern Implementations

This document provides comprehensive documentation for all design patterns implemented in the LMS backend, following Laravel 12 best practices and referencing [refactoring.guru](https://refactoring.guru).

## Table of Contents

- [Overview](#overview)
- [Implemented Patterns](#implemented-patterns)
  - [1. Repository Pattern](#1-repository-pattern-auth-domain)
  - [2. Specification Pattern](#2-specification-pattern-subscriptions-domain)
  - [3. Observer Pattern](#3-observer-pattern-notifications-domain)
  - [4. Strategy Pattern](#4-strategy-pattern-gamification-domain)
  - [5. Builder Pattern](#5-builder-pattern-videos-domain)
  - [6. State Pattern](#6-state-pattern-enrollments-domain)
  - [7. Factory Pattern](#7-factory-pattern-subscriptions-domain)
- [When to Use Each Pattern](#when-to-use-each-pattern)
- [Running Tests](#running-tests)
- [References](#references)

---

## Overview

Design patterns are reusable solutions to common problems in software design. This project implements seven key patterns to improve code maintainability, testability, and flexibility.

---

## Implemented Patterns

### 1. Repository Pattern (Auth Domain)

**Purpose:** Abstract data access layer to separate business logic from persistence logic, enabling better testability and flexibility in changing data sources.

**Location:** `backend/app/Domains/Auth/Repositories/`

**Files:**
| File | Description |
|------|-------------|
| [`StudentRepositoryInterface.php`](backend/app/Domains/Auth/Repositories/StudentRepositoryInterface.php) | Interface defining the repository contract |
| [`EloquentStudentRepository.php`](backend/app/Domains/Auth/Repositories/EloquentStudentRepository.php) | Eloquent ORM implementation |

**Benefits:**
- **Separation of Concerns:** Isolates data access logic from business logic
- **Testability:** Easy to mock repositories in unit tests
- **Flexibility:** Can switch between data sources (MySQL, MongoDB, API) without changing business logic
- **Maintainability:** Centralized query logic reduces code duplication

**Code Usage Example:**

```php
use App\Domains\Auth\Repositories\StudentRepositoryInterface;

class StudentService
{
    public function __construct(
        private StudentRepositoryInterface $studentRepository
    ) {}

    public function getActiveStudents(string $academyId): Collection
    {
        return $this->studentRepository->getForAcademy($academyId, [
            'status' => 'active'
        ]);
    }
}
```

**Binding in Service Provider:**

```php
// In AppServiceProvider.php
use App\Domains\Auth\Repositories\StudentRepositoryInterface;
use App\Domains\Auth\Repositories\EloquentStudentRepository;

public function register(): void
{
    $this->app->bind(
        StudentRepositoryInterface::class,
        EloquentStudentRepository::class
    );
}
```

**Test File:** [`EloquentStudentRepositoryTest.php`](backend/tests/Unit/Auth/Repositories/EloquentStudentRepositoryTest.php)

**Reference:** [Repository Pattern - refactoring.guru](https://refactoring.guru/design-patterns/repository)

---

### 2. Specification Pattern (Subscriptions Domain)

**Purpose:** Encapsulate business rules in reusable, composable specification objects that can be combined using boolean logic (AND, OR, NOT).

**Location:** `backend/app/Domains/Subscriptions/Specifications/`

**Files:**
| File | Description |
|------|-------------|
| [`SpecificationInterface.php`](backend/app/Domains/Subscriptions/Specifications/SpecificationInterface.php) | Base interface for all specifications |
| [`AbstractSpecification.php`](backend/app/Domains/Subscriptions/Specifications/AbstractSpecification.php) | Abstract base class with combinator methods |
| [`AndSpecification.php`](backend/app/Domains/Subscriptions/Specifications/AndSpecification.php) | Combines two specifications with AND logic |
| [`OrSpecification.php`](backend/app/Domains/Subscriptions/Specifications/OrSpecification.php) | Combines two specifications with OR logic |
| [`NotSpecification.php`](backend/app/Domains/Subscriptions/Specifications/NotSpecification.php) | Negates a specification |
| [`SubscriptionCanRenewSpecification.php`](backend/app/Domains/Subscriptions/Specifications/SubscriptionCanRenewSpecification.php) | Business rule for subscription renewal |

**Benefits:**
- **Composability:** Combine multiple business rules using boolean operators
- **Reusability:** Specifications can be reused across different contexts
- **Testability:** Each specification can be tested in isolation
- **Self-Documenting:** Specification names clearly express business rules

**Code Usage Example:**

```php
use App\Domains\Subscriptions\Specifications\SubscriptionCanRenewSpecification;
use App\Domains\Subscriptions\Specifications\IsActiveSpecification;

// Single specification
$canRenewSpec = new SubscriptionCanRenewSpecification();
if ($canRenewSpec->isSatisfiedBy($subscription)) {
    // Allow renewal
}

// Composed specifications
$activeAndCanRenew = (new IsActiveSpecification())
    ->and(new SubscriptionCanRenewSpecification());

if ($activeAndCanRenew->isSatisfiedBy($subscription)) {
    // Subscription is active AND can be renewed
}
```

**Test File:** [`SubscriptionCanRenewSpecificationTest.php`](backend/tests/Unit/Subscriptions/Specifications/SubscriptionCanRenewSpecificationTest.php)

**Reference:** [Specification Pattern - refactoring.guru](https://refactoring.guru/design-patterns/specification)

---

### 3. Observer Pattern (Notifications Domain)

**Purpose:** Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

**Location:** 
- `backend/app/Domains/Notifications/Observers/`
- `backend/app/Domains/Notifications/Events/`

**Files:**
| File | Description |
|------|-------------|
| [`NotificationChannelObserverInterface.php`](backend/app/Domains/Notifications/Observers/NotificationChannelObserverInterface.php) | Interface for channel observers |
| [`DatabaseChannelObserver.php`](backend/app/Domains/Notifications/Observers/DatabaseChannelObserver.php) | Handles database channel notifications |
| [`BroadcastChannelObserver.php`](backend/app/Domains/Notifications/Observers/BroadcastChannelObserver.php) | Handles real-time broadcast notifications |
| [`FcmChannelObserver.php`](backend/app/Domains/Notifications/Observers/FcmChannelObserver.php) | Handles Firebase Cloud Messaging |
| [`AnalyticsChannelObserver.php`](backend/app/Domains/Notifications/Observers/AnalyticsChannelObserver.php) | Handles analytics tracking |
| [`NotificationEventSubscriber.php`](backend/app/Domains/Notifications/Listeners/NotificationEventSubscriber.php) | Event subscriber coordinating observers |
| [`NotificationSendingEvent.php`](backend/app/Domains/Notifications/Events/NotificationSendingEvent.php) | Event dispatched before sending |
| [`NotificationSentEvent.php`](backend/app/Domains/Notifications/Events/NotificationSentEvent.php) | Event dispatched after sending |

**Benefits:**
- **Loose Coupling:** Subjects and observers are independent
- **Open/Closed Principle:** Add new observers without modifying existing code
- **Event-Driven Architecture:** Natural fit for notification systems
- **Broadcast Communication:** One event triggers multiple responses

**Code Usage Example:**

```php
use App\Domains\Notifications\Events\NotificationSentEvent;
use App\Domains\Notifications\Observers\DatabaseChannelObserver;

// Dispatching an event
event(new NotificationSentEvent(
    notificationId: $notification->id,
    notifiable: $user,
    userType: 'student',
    title: 'New Message',
    message: 'You have a new message',
    data: ['action' => 'view'],
    type: 'message',
    channels: ['database', 'fcm'],
    fcmSent: true
));

// Observer handling
class DatabaseChannelObserver implements NotificationChannelObserverInterface
{
    public function handle(NotificationSentEvent $event): void
    {
        if ($this->shouldHandle($event)) {
            // Store notification in database
        }
    }

    public function shouldHandle(NotificationSentEvent $event): bool
    {
        return $event->wasSentVia('database');
    }
}
```

**Test File:** [`NotificationObserverTest.php`](backend/tests/Unit/Notifications/Observers/NotificationObserverTest.php)

**Reference:** [Observer Pattern - refactoring.guru](https://refactoring.guru/design-patterns/observer)

---

### 4. Strategy Pattern (Gamification Domain)

**Purpose:** Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

**Location:** `backend/app/Domains/Gamification/Strategies/`

**Files:**
| File | Description |
|------|-------------|
| [`PointCalculationStrategyInterface.php`](backend/app/Domains/Gamification/Strategies/PointCalculationStrategyInterface.php) | Strategy interface |
| [`AttendancePointStrategy.php`](backend/app/Domains/Gamification/Strategies/AttendancePointStrategy.php) | Points for attendance |
| [`ExamPointStrategy.php`](backend/app/Domains/Gamification/Strategies/ExamPointStrategy.php) | Points for exam performance |
| [`VideoPointStrategy.php`](backend/app/Domains/Gamification/Strategies/VideoPointStrategy.php) | Points for video completion |
| [`ManualBonusStrategy.php`](backend/app/Domains/Gamification/Strategies/ManualBonusStrategy.php) | Manual bonus points |
| [`PointCalculator.php`](backend/app/Domains/Gamification/Services/PointCalculator.php) | Context class managing strategies |

**Benefits:**
- **Open/Closed Principle:** Add new strategies without modifying existing code
- **Single Responsibility:** Each strategy handles one calculation type
- **Runtime Flexibility:** Switch algorithms at runtime
- **Easy Testing:** Test each strategy in isolation

**Code Usage Example:**

```php
use App\Domains\Gamification\Services\PointCalculator;
use App\Domains\Gamification\Strategies\AttendancePointStrategy;
use App\Domains\Gamification\Strategies\ExamPointStrategy;

// Register strategies
$calculator = new PointCalculator();
$calculator->registerStrategy(new AttendancePointStrategy());
$calculator->registerStrategy(new ExamPointStrategy());
$calculator->registerStrategy(new VideoPointStrategy());

// Calculate points - automatically selects appropriate strategy
$transaction = $calculator->awardPoints($student, $lecture);
// Or for exam results
$transaction = $calculator->awardPoints($student, $examResult);
```

**Strategy Interface:**

```php
interface PointCalculationStrategyInterface
{
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int;
    public function supports(mixed $context): bool;
    public function getTransactionType(): string;
}
```

**Test File:** [`PointStrategyTest.php`](backend/tests/Unit/Gamification/Strategies/PointStrategyTest.php)

**Reference:** [Strategy Pattern - refactoring.guru](https://refactoring.guru/design-patterns/strategy)

---

### 5. Builder Pattern (Videos Domain)

**Purpose:** Separate the construction of a complex object from its representation so that the same construction process can create different representations.

**Location:** `backend/app/Domains/Videos/Builders/`

**Files:**
| File | Description |
|------|-------------|
| [`VideoBuilder.php`](backend/app/Domains/Videos/Builders/VideoBuilder.php) | Builder for Video model instances |
| [`VideoUploadSessionBuilder.php`](backend/app/Domains/Videos/Builders/VideoUploadSessionBuilder.php) | Builder for upload session objects |

**Benefits:**
- **Fluent Interface:** Readable, chainable method calls
- **Default Values:** Sensible defaults for optional parameters
- **Immutable Construction:** Build objects step-by-step
- **Validation:** Validate before building final object
- **Complex Object Creation:** Simplifies creating objects with many parameters

**Code Usage Example:**

```php
use App\Domains\Videos\Builders\VideoBuilder;
use App\Domains\Videos\DTOs\VideoActorContext;

// Using context
$video = (new VideoBuilder())
    ->withContext($actorContext)
    ->titled('Introduction to Physics')
    ->describedAs('Basic physics concepts')
    ->forGrade($gradeId)
    ->forLecture($lectureId)
    ->withGroups([$groupId1, $groupId2])
    ->scheduledAt('2024-03-15 10:00:00')
    ->build();

// Manual construction
$video = (new VideoBuilder())
    ->ownedBy('Teacher', $teacherId)
    ->uploadedBy('Secretary', $secretaryId)
    ->forAcademy($academyId)
    ->titled('Advanced Mathematics')
    ->withFile($path, $mimeType, $size)
    ->asPublic()
    ->build();
```

**Test File:** [`VideoBuilderTest.php`](backend/tests/Unit/Videos/Builders/VideoBuilderTest.php)

**Reference:** [Builder Pattern - refactoring.guru](https://refactoring.guru/design-patterns/builder)

---

### 6. State Pattern (Enrollments Domain)

**Purpose:** Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.

**Location:** `backend/app/Domains/Enrollments/States/`

**Files:**
| File | Description |
|------|-------------|
| [`EnrollmentStateInterface.php`](backend/app/Domains/Enrollments/States/EnrollmentStateInterface.php) | State interface |
| [`AbstractEnrollmentState.php`](backend/app/Domains/Enrollments/States/AbstractEnrollmentState.php) | Base class with common behavior |
| [`TrialState.php`](backend/app/Domains/Enrollments/States/TrialState.php) | Trial period state |
| [`ActiveState.php`](backend/app/Domains/Enrollments/States/ActiveState.php) | Active subscription state |
| [`InactiveState.php`](backend/app/Domains/Enrollments/States/InactiveState.php) | Inactive/paused state |
| [`GracePeriodState.php`](backend/app/Domains/Enrollments/States/GracePeriodState.php) | Grace period after expiration |
| [`ExpiredState.php`](backend/app/Domains/Enrollments/States/ExpiredState.php) | Expired subscription state |
| [`EnrollmentStateFactory.php`](backend/app/Domains/Enrollments/States/EnrollmentStateFactory.php) | Factory for creating states |

**Benefits:**
- **Clean State Transitions:** Each state encapsulates its behavior
- **Eliminates Conditionals:** No large if/else or switch statements
- **Easy to Add States:** Add new states without modifying existing ones
- **Self-Documenting:** State names clearly indicate enrollment status

**Code Usage Example:**

```php
use App\Domains\Enrollments\States\EnrollmentStateFactory;

// Get current state
$state = EnrollmentStateFactory::create($enrollment->status);

// Check capabilities
if ($state->canAccessContent($enrollment)) {
    // Allow content access
}

if ($state->canRenew($enrollment)) {
    // Show renewal option
}

// Get state info
$label = $state->getLabel();    // "Active"
$color = $state->getColor();    // "green"
$isTrial = $state->isTrial();   // false

// Get allowed transitions
$transitions = $state->getAllowedTransitions();
// ['inactive', 'expired']
```

**State Interface:**

```php
interface EnrollmentStateInterface
{
    public function getName(): string;
    public function canActivate(Enrollment $enrollment): bool;
    public function canDeactivate(Enrollment $enrollment): bool;
    public function canRenew(Enrollment $enrollment): bool;
    public function canAccessContent(Enrollment $enrollment): bool;
    public function isTrial(): bool;
    public function isActive(): bool;
    public function isExpired(): bool;
    public function getColor(): string;
    public function getLabel(): string;
    public function getNextState(Enrollment $enrollment): ?EnrollmentStateInterface;
    public function getAllowedTransitions(): array;
}
```

**Test File:** [`EnrollmentStateTest.php`](backend/tests/Unit/Enrollments/States/EnrollmentStateTest.php)

**Reference:** [State Pattern - refactoring.guru](https://refactoring.guru/design-patterns/state)

---

### 7. Factory Pattern (Subscriptions Domain)

**Purpose:** Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.

**Location:** `backend/app/Domains/Subscriptions/Plans/`

**Files:**
| File | Description |
|------|-------------|
| [`PlanInterface.php`](backend/app/Domains/Subscriptions/Plans/PlanInterface.php) | Product interface |
| [`AbstractPlan.php`](backend/app/Domains/Subscriptions/Plans/AbstractPlan.php) | Base plan implementation |
| [`TrialPlan.php`](backend/app/Domains/Subscriptions/Plans/TrialPlan.php) | Trial plan product |
| [`MonthlyPlan.php`](backend/app/Domains/Subscriptions/Plans/MonthlyPlan.php) | Monthly plan product |
| [`QuarterlyPlan.php`](backend/app/Domains/Subscriptions/Plans/QuarterlyPlan.php) | Quarterly (3 months) plan |
| [`SemiAnnualPlan.php`](backend/app/Domains/Subscriptions/Plans/SemiAnnualPlan.php) | Semi-annual (6 months) plan |
| [`AnnualPlan.php`](backend/app/Domains/Subscriptions/Plans/AnnualPlan.php) | Annual (12 months) plan |
| [`CustomPlan.php`](backend/app/Domains/Subscriptions/Plans/CustomPlan.php) | Custom duration plan |
| [`PlanFactory.php`](backend/app/Domains/Subscriptions/Plans/PlanFactory.php) | Factory class |

**Benefits:**
- **Loose Coupling:** Client code doesn't need to know concrete classes
- **Single Responsibility:** Creation logic centralized in factory
- **Open/Closed Principle:** Add new plan types without modifying client code
- **Consistent Object Creation:** Ensures valid plan configuration

**Code Usage Example:**

```php
use App\Domains\Subscriptions\Plans\PlanFactory;

// Create by name
$plan = PlanFactory::create('monthly');
$plan = PlanFactory::create('annual');
$plan = PlanFactory::create('custom', months: 4);

// Use specific factory methods
$trialPlan = PlanFactory::createTrial();
$monthlyPlan = PlanFactory::createMonthly();
$annualPlan = PlanFactory::createAnnual();
$customPlan = PlanFactory::createCustom(months: 4);

// Calculate subscription amount
$amount = $plan->calculateAmount(
    seats: 50,
    pricePerSeat: 10.00,
    storageGb: 100,
    pricePerGb: 0.50
);

// Get end date
$endDate = $plan->getEndDate($startDate);

// Get available plans
$plans = PlanFactory::getAvailablePlans();
// ['trial', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']
```

**Plan Interface:**

```php
interface PlanInterface
{
    public function getName(): string;
    public function getLabel(): string;
    public function getMonths(): int;
    public function getTrialDays(): int;
    public function isTrial(): bool;
    public function isCustom(): bool;
    public function calculateAmount(int $seats, float $pricePerSeat, int $storageGb, float $pricePerGb): float;
    public function getEndDate(Carbon $startDate): ?Carbon;
    public function buildNotes(int $storageGb, float $storageAmount): string;
}
```

**Reference:** [Factory Method Pattern - refactoring.guru](https://refactoring.guru/design-patterns/factory-method)

---

## When to Use Each Pattern

| Pattern | Use When... | Avoid When... |
|---------|-------------|---------------|
| **Repository** | You need to abstract data access; want testable data layers; may change data sources | Working with simple CRUD operations; performance-critical paths where abstraction adds overhead |
| **Specification** | You have complex, reusable business rules; need to combine rules dynamically | Business rules are simple and unlikely to change; over-engineering for basic conditions |
| **Observer** | Objects need to react to events; building event-driven systems; multiple subscribers needed | Only one observer; tight coupling is acceptable; simple one-to-one relationships |
| **Strategy** | You have multiple algorithms for the same task; need to switch algorithms at runtime | Only one algorithm exists; algorithm selection is static |
| **Builder** | Creating complex objects with many optional parameters; want fluent, readable construction | Objects are simple with few parameters; direct constructor calls are sufficient |
| **State** | Object behavior depends on state; complex state transitions; eliminating conditional logic | Only a few states with simple behavior; state transitions are trivial |
| **Factory** | Creating objects without specifying exact class; centralized object creation logic | Object creation is straightforward; only one concrete type exists |

---

## Running Tests

Run all pattern tests:

```bash
# All unit tests
cd backend
php artisan test --filter=Unit

# Specific pattern tests
php artisan test tests/Unit/Auth/Repositories/EloquentStudentRepositoryTest.php
php artisan test tests/Unit/Subscriptions/Specifications/SubscriptionCanRenewSpecificationTest.php
php artisan test tests/Unit/Notifications/Observers/NotificationObserverTest.php
php artisan test tests/Unit/Gamification/Strategies/PointStrategyTest.php
php artisan test tests/Unit/Videos/Builders/VideoBuilderTest.php
php artisan test tests/Unit/Enrollments/States/EnrollmentStateTest.php

# Using Pest
pest tests/Unit/Auth/Repositories/EloquentStudentRepositoryTest.php
pest tests/Unit/Subscriptions/Specifications/
pest tests/Unit/Notifications/Observers/
pest tests/Unit/Gamification/Strategies/
pest tests/Unit/Videos/Builders/
pest tests/Unit/Enrollments/States/

# Run with coverage
php artisan test --coverage --min=80
```

---

## References

### External Resources

| Resource | URL |
|----------|-----|
| **Refactoring.Guru** | [https://refactoring.guru/design-patterns](https://refactoring.guru/design-patterns) |
| **Repository Pattern** | [https://refactoring.guru/design-patterns/repository](https://refactoring.guru/design-patterns/repository) |
| **Specification Pattern** | [https://refactoring.guru/design-patterns/specification](https://refactoring.guru/design-patterns/specification) |
| **Observer Pattern** | [https://refactoring.guru/design-patterns/observer](https://refactoring.guru/design-patterns/observer) |
| **Strategy Pattern** | [https://refactoring.guru/design-patterns/strategy](https://refactoring.guru/design-patterns/strategy) |
| **Builder Pattern** | [https://refactoring.guru/design-patterns/builder](https://refactoring.guru/design-patterns/builder) |
| **State Pattern** | [https://refactoring.guru/design-patterns/state](https://refactoring.guru/design-patterns/state) |
| **Factory Method Pattern** | [https://refactoring.guru/design-patterns/factory-method](https://refactoring.guru/design-patterns/factory-method) |
| **Laravel Documentation** | [https://laravel.com/docs/12.x](https://laravel.com/docs/12.x) |
| **Martin Fowler - Specification** | [https://martinfowler.com/apsupp/spec.pdf](https://martinfowler.com/apsupp/spec.pdf) |

### Books

- **Design Patterns: Elements of Reusable Object-Oriented Software** - Gang of Four
- **Head First Design Patterns** - Eric Freeman & Elisabeth Robson
- **PHP 8 Objects, Patterns, and Practice** - Matt Zandstra
- **Laravel: Up & Running** - Matt Stauffer

---

## Contributing

When adding new design patterns:

1. Follow the existing directory structure under `backend/app/Domains/`
2. Create interfaces before implementations
3. Write comprehensive unit tests
4. Update this documentation file
5. Reference refactoring.guru for pattern definitions

---

*Last Updated: March 2026*
