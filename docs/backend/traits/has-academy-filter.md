---
title: HasAcademyFilter Trait
description: Multi-tenancy scope filtering for academy-scoped models in the Neetaq platform
---

# HasAcemyFilter Trait

The `HasAcademyFilter` trait provides methods for filtering queries based on academy ownership, enabling multi-tenancy across the platform. It handles both direct and indirect academy associations.

## Methods

### `applyAcademyFilter($query, ?int $academyId): void`

Applies an academy filter to the query, with support for models that have an indirect academy relationship through a `grade` relation.

```php
// In a controller or repository
$query = Student::query();
$this->applyAcademyFilter($query, $academyId);
$students = $query->get();
```

**Behavior:**

| Condition | Filter Applied |
|-----------|---------------|
| `$academyId` is a valid ID | Filters by `academy_id` on the model or its `grade` relationship |
| `$academyId` is `null` or `'independent'` | Filters for `academy_id IS NULL` (independent records) |

**For models with a `grade` relationship:**

When the model does not have a direct `academy_id` column but is associated with an academy through a `grade`, the method applies a `whereHas` query:

```php
$query->whereHas('grade', function ($q) use ($academyId) {
    $q->where('academy_id', $academyId);
});
```

### `applyDirectAcademyFilter($query, ?int $academyId): void`

Applies a direct `academy_id` filter on the model's own table without traversing relationships.

```php
$query = Teacher::query();
$this->applyDirectAcademyFilter($query, $academyId);
$teachers = $query->get();
```

**Behavior:**

| Condition | Filter Applied |
|-----------|---------------|
| `$academyId` is a valid ID | `where('academy_id', $academyId)` |
| `$academyId` is `null` or `'independent'` | `whereNull('academy_id')` |

This is used for models like `Teacher` or `Secretary` that have a direct `academy_id` column on their own table.

## Handling Independent Mode

When an academy ID is `null` or the string `'independent'`, the trait filters for records that are **not** associated with any academy:

```php
// Both produce the same result
$this->applyAcademyFilter($query, null);
$this->applyAcademyFilter($query, 'independent');

// Resulting SQL (direct filter)
// WHERE academy_id IS NULL
```

This supports independent teachers who operate outside of any academy structure.

## Usage in Controllers

```php
use App\Traits\HasAcademyFilter;
use App\Traits\ApiResponseTrait;

class StudentController extends Controller
{
    use ApiResponseTrait;
    use HasAcademyFilter;

    public function index(Request $request)
    {
        $query = Student::query();
        $this->applyAcademyFilter($query, $request->academy_id);

        return $this->paginated(
            $query->paginate($request->per_page ?? 15),
        );
    }
}
```

## Usage in Repositories

```php
class EnrollmentRepository
{
    use HasAcademyFilter;

    public function getByAcademy(?int $academyId): Collection
    {
        $query = Enrollment::query()->with(['student', 'grade']);
        $this->applyAcademyFilter($query, $academyId);

        return $query->get();
    }
}
```

## See Also

- [ResolvesAcademy Trait](./resolves-academy) - Academy resolution from requests
- [Traits Reference](./index) - All available traits
