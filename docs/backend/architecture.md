---
title: Backend Architecture
description: Layering conventions, folder structure, and domain-driven design
---

# Backend Architecture

The Neetaq backend follows Domain-Driven Design (DDD) principles with a clean separation of concerns.

## Architecture Overview

```mermaid
flowchart TB
    subgraph "Presentation Layer"
        Routes["Routes<br/>api.php"]
        Controllers["Controllers<br/>Http/Controllers"]
        Resources["API Resources<br/>Http/Resources"]
    end
    
    subgraph "Application Layer"
        Services["Application Services<br/>Services/"]
        Actions["Actions<br/>Actions/"]
        DTOs["DTOs<br/>DTOs/"]
    end
    
    subgraph "Domain Layer"
        Models["Models<br/>Models/"]
        Enums["Enums<br/>Enums/"]
        Events["Events<br/>Events/"]
        Policies["Policies<br/>Policies/"]
    end
    
    subgraph "Infrastructure Layer"
        Providers["Service Providers<br/>Providers/"]
        Middleware["Middleware<br/>Http/Middleware"]
        Adapters["Adapters<br/>Adapters/"]
    end
    
    subgraph "Data Layer"
        DB[("Database<br/>MySQL")]
        Redis[("Cache<br/>Redis")]
        R2["Storage<br/>Cloudflare R2"]
    end
    
    Routes --> Controllers
    Controllers --> Services
    Controllers --> Actions
    Services --> Models
    Services --> DTOs
    Actions --> Models
    Models --> DB
    Models --> Redis
    Adapters --> R2
```

## Domain Structure

The backend is organized into domains under `app/Domains/`:

```
backend/app/Domains/
├── Application/           # Shared application logic
│   ├── Http/
│   │   ├── Controllers/   # Organized by role (Admin, Teacher, Student, etc.)
│   │   ├── Middleware/    # Custom middleware
│   │   └── Resources/     # API Resources
│   └── Services/          # Application services
│
├── Auth/                  # Authentication & Authorization
│   ├── Actions/           # Login, OTP, etc.
│   ├── Enums/             # Role enums, status enums
│   ├── Http/Middleware/   # Auth middleware
│   ├── Models/            # User models (Admin, Teacher, Student, etc.)
│   ├── Notifications/     # Auth-related notifications
│   └── Services/          # Auth services
│
├── Exams/                 # Exam & Assessment domain
│   ├── Actions/           # Start/Submit exam
│   ├── Builders/          # Query builders
│   ├── DTOs/              # Exam data transfer objects
│   ├── Enums/             # Exam status, question types
│   ├── Events/            # Exam lifecycle events
│   ├── Jobs/              # Background processing
│   ├── Listeners/         # Event listeners
│   ├── Models/            # Exam, Question, Attempt, Result
│   ├── Notifications/     # Exam notifications
│   └── Resources/         # API resources
│
├── Lectures/              # Lecture & Attendance domain
│   ├── Actions/           # Activate/Close lecture
│   ├── DTOs/              # Lecture data objects
│   ├── Enums/             # Attendance methods, status
│   ├── Events/            # Lecture lifecycle
│   ├── Jobs/              # Scheduled lecture jobs
│   ├── Listeners/         # Event listeners
│   ├── Models/            # Lecture, Attendance, Session
│   ├── Notifications/     # Attendance notifications
│   ├── Policies/          # Authorization policies
│   └── Resources/         # API resources
│
├── Enrollments/           # Student enrollment domain
│   ├── DTOs/              # Enrollment data
│   ├── Enums/             # Enrollment status, group types
│   ├── Models/            # Enrollment, Group, Grade
│   └── Resources/         # API resources
│
├── Notifications/         # Notification system
│   ├── Channels/          # FCM, Voice, Database
│   ├── Contracts/         # Channel interfaces
│   ├── DTOs/              # Notification data
│   ├── Enums/             # Notification types
│   ├── Events/            # Notification events
│   ├── Factories/         # Notification factories
│   ├── Jobs/              # Bulk notification jobs
│   ├── Listeners/         # Broadcast listeners
│   ├── Models/            # SentNotification, AcademyNotification
│   ├── Resources/         # API resources
│   └── Services/          # Notification services
│
├── Subscriptions/         # Payment & Subscription domain
│   ├── DTOs/              # Payment data
│   ├── Enums/             # Subscription status, payment methods
│   ├── Events/            # Subscription events
│   ├── Exceptions/        # Quota exceptions
│   ├── Jobs/              # Expiration checks
│   ├── Listeners/         # Expiration listeners
│   ├── Models/            # Subscription, PaymentLog
│   └── Specifications/    # Business rules
│
├── Media/                 # File storage domain
│   ├── Adapters/          # R2, Local storage adapters
│   ├── Jobs/              # Upload processing
│   └── Services/          # Image processing, avatar service
│
└── Support/               # Shared support utilities
    ├── Enums/             # Common enums
    ├── Exceptions/        # Domain exceptions
    ├── Filters/           # Query filter classes
    │   ├── BaseFilter.php
    │   ├── LectureFilter.php
    │   ├── EnrollmentFilter.php
    │   ├── GroupFilter.php
    │   ├── GradeFilter.php
    │   └── VideoFilter.php
    ├── Resources/         # Shared API resources
    ├── Services/          # Support services (Cache, Helper)
    └── Traits/            # Reusable traits
```

## Naming Conventions

### Controllers

```php
// Format: {Role}{Entity}Controller.php
AdminTeacherController.php      // Admin managing teachers
TeacherStudentController.php    // Teacher managing students
StudentExamController.php       // Student taking exams
AcademyDashboardController.php  // Academy dashboard
```

### Services

```php
// Format: {Entity}Service.php or {Role}{Entity}Service.php
TeacherService.php              // General teacher operations
AdminTeacherService.php         // Admin-specific teacher operations
StudentExamService.php          // Student exam operations
NotificationService.php         // General notification service
```

### Models

```php
// Singular, PascalCase
Teacher.php
Student.php
Exam.php
ExamAttempt.php
LectureSession.php
```

### DTOs

```php
// Format: {Entity}Data.php
TeacherData.php
StudentExamData.php
CreateEnrollmentDTO.php
```

### Resources

```php
// Format: {Entity}Resource.php
TeacherResource.php
StudentDashboardResource.php
ExamResultDetailResource.php
```

## Layer Responsibilities

### Controllers (Presentation Layer)

- Handle HTTP requests/responses
- Delegate to services/actions
- Return API resources

```php
<?php
namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Services\Teacher\TeacherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private TeacherService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $students = $this->service->getStudents($request->user());
        return $this->successResponse($students);
    }
}
```

### Services (Application Layer)

- Contain business logic
- Orchestrate domain operations
- Handle transactions

```php
<?php
namespace App\Domains\Application\Services\Teacher;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
use Illuminate\Support\Collection;

class TeacherService
{
    public function getStudents(Teacher $teacher): Collection
    {
        return $teacher->students()
            ->with('groups')
            ->get();
    }
}
```

### Models (Domain Layer)

- Define data structure
- Encapsulate business rules
- Define relationships

```php
<?php
namespace App\Domains\Auth\Models;

use App\Domains\Enrollments\Models\Enrollment;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Authenticatable
{
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'enrollments')
            ->withPivot(['grade_id', 'group_id']);
    }
}
```

### Actions (Application Layer)

Single-responsibility classes for discrete operations:

```php
<?php
namespace App\Domains\Exams\Actions;

use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;

class StartAttemptAction
{
    public function execute(Exam $exam, Student $student): ExamAttempt
    {
        return ExamAttempt::create([
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'started_at' => now(),
            'status' => ExamAttemptStatus::IN_PROGRESS,
        ]);
    }
}
```

## Query Filter Pattern

The project uses a dedicated Filter pattern for query filtering, keeping models clean and separating business logic from data access:

### Base Filter

All filters extend from `BaseFilter` which provides the filtering logic:

```php
<?php
namespace App\Domains\Support\Filters;

use Illuminate\Database\Eloquent\Builder;

abstract class BaseFilter
{
    public function __construct(protected array $filters) {}

    public function apply(Builder $query): Builder
    {
        foreach ($this->filters as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $method = 'filter' . str_replace('_', '', ucwords($key, '_'));

            if (method_exists($this, $method)) {
                $this->$method($query, $value);
            }
        }

        return $query;
    }
}
```

### Domain-Specific Filters

Each domain has its own filter class:

```php
<?php
namespace App\Domains\Support\Filters;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class LectureFilter extends BaseFilter
{
    protected function filterSearch(Builder $query, string $value): void
    {
        $query->where('title', 'like', "%{$value}%");
    }

    protected function filterDateFrom(Builder $query, string $value): void
    {
        $query->whereDate('start_time', '>=', $value);
    }

    protected function filterStatus(Builder $query, string $value): void
    {
        match ($value) {
            'today'     => $query->where(fn ($q) =>
                                $q->whereDate('start_time', Carbon::today())
                                  ->orWhere(fn ($q) =>
                                    $q->where('is_recurring', true)
                                      ->whereJsonContains('recurrence_days', Carbon::now()->format('l'))
                                  )
                             ),
            'upcoming'  => $query->where('start_time', '>', now())->where('is_active', false),
            'ongoing'   => $query->where(fn ($q) =>
                                $q->where('is_active', true)
                                  ->orWhere(fn ($q) =>
                                    $q->where('start_time', '<=', now())->where('end_time', '>', now())
                                  )
                             ),
            default     => null,
        };
    }
}
```

### Usage in Services

Filters are used in services, keeping the models clean:

```php
<?php
namespace App\Domains\Application\Services\Teacher;

use App\Domains\Support\Filters\LectureFilter;
use App\Domains\Lectures\Models\Lecture;

class LectureService
{
    public function getLectures($teacher, int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        $query = $teacher->lectures()
            ->with(['grade', 'group'])
            ->latest();

        // Apply filters using Filter class
        (new LectureFilter($filters))->apply($query);

        return $query->paginate($perPage);
    }
}
```

### Available Filters

| Filter | Domain | Filters By |
|--------|--------|------------|
| `LectureFilter` | Lectures | search, date_from, date_to, group_id, teacher_id, status |
| `EnrollmentFilter` | Enrollments | search (student), status, grade_id, group_id |
| `GroupFilter` | Enrollments | search, grade_id |
| `GradeFilter` | Enrollments | search |
| `VideoFilter` | Videos | search, status, owner_id, owner_type, grade_id, group_id |
| `ExamFilter` | Exams | search (title/subject), date_from, date_to, grade_id, group_id |

## Repository Pattern

The project uses Eloquent directly with query scopes and builders:

```php
<?php
namespace App\Domains\Exams\Builders;

use Illuminate\Database\Eloquent\Builder;

class ExamAttemptBuilder extends Builder
{
    public function forStudent(string $studentId): self
    {
        return $this->where('student_id', $studentId);
    }

    public function inProgress(): self
    {
        return $this->where('status', ExamAttemptStatus::IN_PROGRESS);
    }

    public function completedToday(): self
    {
        return $this->whereDate('completed_at', today());
    }
}
```

## Dependency Injection

All dependencies are injected through constructors:

```php
class ExamController extends Controller
{
    public function __construct(
        private StartAttemptAction $startAttempt,
        private SubmitAttemptAction $submitAttempt,
        private ExamResultService $resultService,
    ) {}
}
```

## Service Provider Registration

```php
<?php
// bootstrap/providers.php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\RepositoryServiceProvider::class,
    App\Providers\SettingsServiceProvider::class,
    App\Providers\HorizonServiceProvider::class,
];
```

## API Response Format

All controllers use the `ApiResponseTrait` for consistent responses:

```php
// Success Response
{
    "status": true,
    "status_code": 200,
    "message": "Success",
    "data": { ... }
}

// Error Response
{
    "status": false,
    "status_code": 400,
    "message": "Validation failed",
    "errors": { ... }
}
```

## References

- [`backend/app/Domains/`](/backend/app/Domains/)
- [`backend/routes/api.php`](/backend/routes/api.php)
- [`backend/app/Domains/Support/Traits/ApiResponseTrait.php`](/backend/app/Domains/Support/Traits/ApiResponseTrait.php)
- [`backend/bootstrap/providers.php`](/backend/bootstrap/providers.php)

## TODO

- [ ] Document event sourcing implementation
- [ ] Add CQRS pattern documentation
- [ ] Document query optimization strategies
- [ ] Add caching layer documentation
