---
title: ResolvesTeacher Trait
description: Teacher resolution from authenticated request in the Neetaq platform
---

# ResolvesTeacher Trait

The `ResolvesTeacher` trait resolves the effective `Teacher` model from the authenticated user's request. It handles the different ways a teacher can be identified depending on the authenticated user type.

## Methods

### `resolveTeacher(Request $request): ?Teacher`

Returns the effective `Teacher` for the current request, or `null` if no teacher can be resolved.

```php
public function exams(Request $request)
{
    $teacher = $this->resolveTeacher($request);

    if ($teacher === null) {
        return $this->forbidden('No teacher association found');
    }

    $exams = $teacher->exams()->paginate();
    return $this->paginated($exams);
}
```

### `resolveTeacherOrFail(Request $request): Teacher`

Returns the effective `Teacher` or throws a 404 exception. Use this when a teacher is required for the operation to proceed.

```php
public function createExam(Request $request)
{
    $teacher = $this->resolveTeacherOrFail($request);
    // Proceed with teacher-specific exam creation
}
```

## Resolution Logic

The trait resolves the teacher differently based on the authenticated user type:

### Teacher Model

When the authenticated user is a `Teacher`, the teacher is the user itself:

```php
// Authenticated as Teacher
$teacher = $request->user(); // Returns the Teacher model directly
```

### Secretary Model

When the authenticated user is a `Secretary`, the teacher is resolved from the secretary's first teacher relationship:

```php
// Authenticated as Secretary
$teacher = $request->user()->teachers()->first(); // First associated teacher
```

## Resolution Table

| User Type | Resolution Path | Nullable |
|-----------|----------------|----------|
| `Teacher` | Direct (`$user`) | No |
| `Secretary` | `$user->teachers()->first()` | No |

## Usage in Controllers

```php
use App\Traits\ResolvesTeacher;
use App\Traits\ApiResponseTrait;

class TeacherExamController extends Controller
{
    use ApiResponseTrait;
    use ResolvesTeacher;

    public function index(Request $request)
    {
        $teacher = $this->resolveTeacherOrFail($request);

        $exams = $teacher->exams()
            ->with(['grade', 'questions'])
            ->paginate($request->per_page ?? 15);

        return $this->paginated($exams);
    }

    public function store(Request $request)
    {
        $teacher = $this->resolveTeacherOrFail($request);

        $exam = $teacher->exams()->create($request->validated());

        return $this->created($exam, 'Exam created successfully');
    }
}
```

## Error Handling

When `resolveTeacherOrFail` is called and no teacher can be resolved, a `ModelNotFoundException` is thrown, which Laravel automatically converts to a 404 JSON response:

```json
{
    "success": false,
    "message": "No query results for model [App\\Domains\\Auth\\Models\\Teacher]"
}
```

## Relationship to ResolvesAcademy

The `ResolvesTeacher` and `ResolvesAcademy` traits are often used together in controllers that need both contexts:

```php
class AcademyTeacherController extends Controller
{
    use ApiResponseTrait;
    use ResolvesAcademy;
    use ResolvesTeacher;

    public function teacherExams(Request $request)
    {
        $academy = $this->resolveAcademyOrFail($request);
        $teacher = $this->resolveTeacherOrFail($request);

        // Verify teacher belongs to this academy
        if ($teacher->academy_id !== $academy->id) {
            return $this->forbidden('Teacher does not belong to this academy');
        }

        return $this->successResponse($teacher->exams);
    }
}
```

## See Also

- [ResolvesAcademy Trait](./resolves-academy) - Academy resolution from requests
- [HasAcademyFilter Trait](./has-academy-filter) - Academy-based query filtering
- [Auth Domain](../domains/auth) - Authentication domain models
