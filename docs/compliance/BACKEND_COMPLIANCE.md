# Backend Constitution Compliance Report

**Audit Date**: YYYY-MM-DD  
**Scope**: backend/app/, backend/routes/, backend/database/, backend/config/  
**Audited Against**: CLAUDE.md v1.1.0

---

## Compliance Score: X%

**Breakdown**:
- ✅ **Compliant Rules**: X
- ❌ **Violations**: X
- ⚠️ **Partial Compliance**: X

---

## Module: app/Http/Controllers/

### ✅ Compliant Rules
- [Section 4.1] Controllers use FormRequest validation
- [Section 4.2] Return API responses via Resources
- ...

### ❌ Violations

#### 1. Business Logic in Controller (High)
**Rule**: [Section 3.1] Controllers MUST be thin. NO business rules.

**File**: `app/Http/Controllers/ExampleController.php`  
**Lines**: 45-78

**Code**:
```php
public function store(Request $request)
{
    // ❌ Direct validation in controller
    $validated = $request->validate([...]);
    
    // ❌ Business logic in controller
    if ($user->role === 'teacher') {
        // complex logic...
    }
    
    // ❌ Direct model manipulation
    $exam = Exam::create($validated);
    
    return response()->json($exam);
}
```

**Why it violates**:
- No FormRequest for validation
- Business logic mixed with HTTP layer
- No DTO/Action pattern
- Returning model directly (not Resource)

**Fix Proposal**:
```php
// 1) Create StoreExamRequest.php
namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

final class StoreExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Exam::class);
    }
    
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'duration' => ['required', 'integer', 'min:1'],
            // ...
        ];
    }
}

// 2) Create ExamData DTO
namespace App\DTOs\Exam;

final readonly class ExamData
{
    public function __construct(
        public string $title,
        public int $duration,
        // ...
    ) {}
    
    public static function fromRequest(StoreExamRequest $request): self
    {
        return new self(
            title: $request->validated('title'),
            duration: $request->validated('duration'),
        );
    }
}

// 3) Create Action
namespace App\Actions\Exam;

use App\DTOs\Exam\ExamData;
use App\Models\Exam;

final class CreateExamAction
{
    public function execute(ExamData $data, User $creator): Exam
    {
        // Business logic here
        return DB::transaction(function () use ($data, $creator) {
            $exam = Exam::create([
                'title' => $data->title,
                'duration' => $data->duration,
                'created_by' => $creator->id,
            ]);
            
            // Additional business logic...
            
            return $exam;
        });
    }
}

// 4) Refactor Controller
public function store(
    StoreExamRequest $request,
    CreateExamAction $action
): JsonResponse {
    $data = ExamData::fromRequest($request);
    $exam = $action->execute($data, $request->user());
    
    return $this->success(
        data: new ExamResource($exam),
        message: 'تم إنشاء الاختبار بنجاح'
    );
}
```

**Suggested Tests**:
```php
// tests/Feature/Exam/CreateExamTest.php
it('creates exam with valid data', function () {
    $teacher = User::factory()->teacher()->create();
    
    $response = $this->actingAs($teacher)
        ->postJson('/api/exams', [
            'title' => 'Math Exam',
            'duration' => 60,
        ]);
    
    $response->assertStatus(201)
        ->assertJsonStructure(['status', 'message', 'data']);
    
    $this->assertDatabaseHas('exams', [
        'title' => 'Math Exam',
        'created_by' => $teacher->id,
    ]);
});

it('prevents unauthorized users from creating exams', function () {
    $student = User::factory()->student()->create();
    
    $response = $this->actingAs($student)
        ->postJson('/api/exams', ['title' => 'Test']);
    
    $response->assertForbidden();
});
```

**Severity**: High  
**Effort**: 4-6 hours per controller  
**Impact**: Maintainability, Testability, Architecture

---

#### 2. Missing Authorization Check (High - Security)
**Rule**: [Section 4.6] Authorization MUST be enforced via Policies/Gates.

**File**: `app/Http/Controllers/StudentController.php`  
**Lines**: 89-95

**Code**:
```php
public function show(int $id): JsonResponse
{
    $student = Student::findOrFail($id); // ❌ No authorization
    return response()->json($student);
}
```

**Why it violates**:
- Missing authorization check (IDOR vulnerability)
- Any authenticated user can view any student
- No Policy enforcement

**Fix Proposal**:
```php
// 1) Create/Update Policy
namespace App\Policies;

use App\Models\User;
use App\Models\Student;

final class StudentPolicy
{
    public function view(User $user, Student $student): bool
    {
        // Teacher can view students in their academy
        if ($user->isTeacher()) {
            return $user->academy_id === $student->academy_id;
        }
        
        // Guardian can view their own children
        if ($user->isGuardian()) {
            return $student->guardians()->where('user_id', $user->id)->exists();
        }
        
        // Student can view themselves
        if ($user->isStudent()) {
            return $user->id === $student->user_id;
        }
        
        return false;
    }
}

// 2) Fix Controller
public function show(int $id): JsonResponse
{
    $student = Student::findOrFail($id);
    
    $this->authorize('view', $student); // ✅ Authorization check
    
    return $this->success(
        data: new StudentResource($student)
    );
}
```

**Suggested Tests**:
```php
it('prevents unauthorized access to student details', function () {
    $teacher1 = User::factory()->teacher()->create(['academy_id' => 1]);
    $teacher2 = User::factory()->teacher()->create(['academy_id' => 2]);
    $student = Student::factory()->create(['academy_id' => 1]);
    
    // Teacher from different academy
    $response = $this->actingAs($teacher2)
        ->getJson("/api/students/{$student->id}");
    
    $response->assertForbidden();
});
```

**Severity**: High (Security - IDOR)  
**Effort**: 1-2 hours  
**Impact**: Security, Data Privacy

---

## Module: app/Models/

### ✅ Compliant Rules
- [Section 4.3] Uses casts consistently
- Uses relationships properly

### ❌ Violations

#### 3. N+1 Query Risk (Medium - Performance)
**Rule**: [Section 4.3] No N+1 queries: always use eager loading.

**File**: `app/Http/Controllers/AcademyController.php`  
**Lines**: 123-130

**Code**:
```php
public function index(): JsonResponse
{
    $academies = Academy::paginate(15); // ❌ No eager loading
    
    return $this->success(
        data: AcademyResource::collection($academies)
    );
}
```

**Academy Resource** accesses relationships:
```php
class AcademyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'teachers_count' => $this->teachers->count(), // ❌ N+1
            'students_count' => $this->students->count(), // ❌ N+1
        ];
    }
}
```

**Why it violates**:
- For 15 academies: 1 + 15 + 15 = 31 queries
- Performance degrades with pagination

**Fix Proposal**:
```php
public function index(): JsonResponse
{
    $academies = Academy::query()
        ->withCount(['teachers', 'students']) // ✅ Eager load counts
        ->paginate(15);
    
    return $this->success(
        data: AcademyResource::collection($academies)
    );
}

// Update Resource:
class AcademyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'teachers_count' => $this->teachers_count, // ✅ From withCount
            'students_count' => $this->students_count,
        ];
    }
}
```

**Severity**: Medium (Performance)  
**Effort**: 30 minutes  
**Impact**: Performance, Scalability

---

## Module: app/Services/ (or Actions/)

### ❌ Violations

#### 4. Mutable State in Service (High - Octane Safety)
**Rule**: [Section 4.7] Octane: NO static mutable properties caching request-dependent data.

**File**: `app/Services/NotificationService.php`  
**Lines**: 15-45

**Code**:
```php
final class NotificationService
{
    private static ?User $currentUser = null; // ❌ Static mutable state
    
    public function sendNotification(User $user, string $message): void
    {
        self::$currentUser = $user; // ❌ Request state in static property
        
        // Send notification...
    }
}
```

**Why it violates**:
- Static property holds request-specific data
- In Octane: state leaks between requests
- User A might see User B's data

**Fix Proposal**:
```php
final class NotificationService
{
    // ✅ No static state
    
    public function sendNotification(User $user, string $message): void
    {
        // Use $user parameter directly
        Notification::send($user, new CustomNotification($message));
    }
}
```

**Suggested Tests**:
```php
it('does not leak state between requests', function () {
    $service = app(NotificationService::class);
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $service->sendNotification($user1, 'Message 1');
    $service->sendNotification($user2, 'Message 2');
    
    // Verify no state pollution
    expect($user1->notifications()->count())->toBe(1);
    expect($user2->notifications()->count())->toBe(1);
});
```

**Severity**: High (Octane Safety - Data Leak Risk)  
**Effort**: 2-3 hours  
**Impact**: Data Security, Production Stability

---

## Module: app/Http/Requests/

### ✅ Compliant Rules
- Most endpoints use FormRequest validation

### ❌ Violations

#### 5. Missing FormRequest (Medium)
**Rule**: [Section 4.2] All input validation MUST be done in FormRequest classes.

**Files Affected**: 8 controller methods with inline validation

**Example**: `app/Http/Controllers/AttendanceController.php:67`

**Fix**: Create FormRequest for each endpoint that validates inline.

**Severity**: Medium  
**Effort**: 1 hour per endpoint  
**Impact**: Maintainability, Consistency

---

## Summary by Severity

| Severity | Count | Estimated Effort |
|----------|-------|------------------|
| High     | X     | X days           |
| Medium   | X     | X days           |
| Low      | X     | X days           |

**Total**: X violations, X days effort

---

## Recommendations

### Immediate Actions (This Sprint)
1. Fix all High severity security issues (IDOR, Authorization)
2. Address Octane safety violations
3. Add missing Policies

### Next Sprint
1. Refactor controllers to use DTO/Action pattern
2. Fix N+1 queries
3. Add missing FormRequests

### Backlog
1. Full test coverage for all Actions
2. Performance optimization
3. Documentation

---

**Next**: See [Frontend Compliance Report](./FRONTEND_COMPLIANCE.md)
