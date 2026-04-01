---
title: ResolvesAcademy Trait
description: Academy resolution from authenticated request in the Neetaq platform
---

# ResolvesAcademy Trait

The `ResolvesAcademy` trait resolves the effective `Academy` model from the authenticated user's request. It handles the different ways an academy can be identified depending on the authenticated user type.

## Methods

### `resolveAcademy(Request $request): ?Academy`

Returns the effective `Academy` for the current request, or `null` if the user is an independent teacher with no academy.

```php
public function dashboard(Request $request)
{
    $academy = $this->resolveAcademy($request);

    if ($academy === null) {
        return $this->successResponse(['mode' => 'independent']);
    }

    return $this->successResponse($academy);
}
```

### `resolveAcademyOrFail(Request $request): Academy`

Returns the effective `Academy` or throws a 404 exception. Use this when an academy is required for the operation to proceed.

```php
public function settings(Request $request)
{
    $academy = $this->resolveAcademyOrFail($request);
    // Proceed with academy-specific logic
}
```

## Resolution Logic

The trait resolves the academy differently based on the authenticated user type:

### Academy Model

When the authenticated user is an `Academy`, the academy is the user itself:

```php
// Authenticated as Academy
$academy = $request->user(); // Returns the Academy model directly
```

### Teacher Model

When the authenticated user is a `Teacher`, the academy is accessed through the teacher's `academy` relationship:

```php
// Authenticated as Teacher
$academy = $request->user()->academy; // May be null for independent teachers
```

### Secretary Model

When the authenticated user is a `Secretary`, the academy is resolved from the secretary's first academy relationship:

```php
// Authenticated as Secretary
$academy = $request->user()->academies()->first(); // First associated academy
```

## Resolution Table

| User Type | Resolution Path | Nullable |
|-----------|----------------|----------|
| `Academy` | Direct (`$user`) | No |
| `Teacher` | `$user->academy` | Yes (independent teachers) |
| `Secretary` | `$user->academies()->first()` | No |

## Usage in Controllers

```php
use App\Traits\ResolvesAcademy;
use App\Traits\ApiResponseTrait;

class AcademyDashboardController extends Controller
{
    use ApiResponseTrait;
    use ResolvesAcademy;

    public function stats(Request $request)
    {
        $academy = $this->resolveAcademyOrFail($request);

        $stats = [
            'total_students' => $academy->students()->count(),
            'total_teachers' => $academy->teachers()->count(),
            'total_exams'    => $academy->exams()->count(),
        ];

        return $this->successResponse($stats);
    }
}
```

## Error Handling

When `resolveAcademyOrFail` is called and no academy can be resolved, a `ModelNotFoundException` is thrown, which Laravel automatically converts to a 404 JSON response:

```json
{
    "success": false,
    "message": "No query results for model [App\\Domains\\Auth\\Models\\Academy]"
}
```

## See Also

- [ResolvesTeacher Trait](./resolves-teacher) - Teacher resolution from requests
- [HasAcademyFilter Trait](./has-academy-filter) - Academy-based query filtering
- [Auth Domain](../domains/auth) - Authentication domain models
