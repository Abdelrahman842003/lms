---
title: StudentPolicy
description: Authorization policy for student resource access
---

# StudentPolicy

**File:** `backend/app/Domains/Auth/Policies/StudentPolicy.php`

Controls access to student resources based on user role and enrollment relationships.

## Policy Methods

| Method | Description | Admin | Teacher | Secretary | Academy |
|--------|-------------|-------|---------|-----------|---------|
| `create()` | Create new student | Yes | Yes | Yes | Yes |
| `view()` | View student details | Yes | Own enrollments | Assigned teacher's | Own students |
| `update()` | Update student | Yes | Own students | Assigned teacher's | Own students |
| `delete()` | Delete student | Yes | Own students | Assigned teacher's | Own students |
| `updatePermissions()` | Update permissions | Yes | Own students | Assigned teacher's | Own students |

## Authorization Logic

### Admin Bypass

The `before()` hook grants admins full access to all student operations:

```php
public function before($user, string $ability): ?bool
{
    if ($user instanceof Admin) {
        return true;
    }

    return null;
}
```

### Enrollment Check

For Teacher, Secretary, and Academy users, the policy validates the student-teacher/academy relationship through enrollments:

```php
// Academy: checks if student belongs to academy
Enrollment::where('student_id', $student->id)
    ->where('academy_id', $user->id)
    ->exists();

// Teacher: checks if student is enrolled with this teacher
$teacher = $this->resolveTeacher($user);
Enrollment::where('student_id', $student->id)
    ->where('teacher_id', $teacher->id)
    ->exists();

// Secretary: resolves teacher first, then checks enrollment
$teacher = $this->resolveTeacher($user);
```

### Secretary Delegation

Secretaries act on behalf of their associated teacher via `resolveTeacher()`:

```php
private function resolveTeacher(Teacher|Secretary $user): ?Teacher
{
    if ($user instanceof Teacher) {
        return $user;
    }

    if ($user instanceof Secretary) {
        return $user->teachers()->first();
    }

    return null;
}
```

## Method Signatures

All methods accept union types for user parameters:

```php
public function create(Admin|Teacher|Secretary|Academy $user): bool
public function view(Admin|Teacher|Secretary|Academy $user, Student $student): bool
public function update(Admin|Teacher|Secretary|Academy $user, Student $student): bool
public function delete(Admin|Teacher|Secretary|Academy $user, Student $student): bool
public function updatePermissions(Admin|Teacher|Secretary|Academy $user, Student $student): bool
```

## Usage

```php
// In controller
$this->authorize('view', $student);

// In route middleware
Route::get('/students/{student}', [StudentController::class, 'show'])
    ->middleware('can:view,student');

// Via Gate facade
Gate::authorize('update', $student);

// Check without throwing
if (Gate::allows('delete', $student)) {
    // proceed
}
```

## References

- [Auth Domain](/backend/domains/auth) - User models (Admin, Teacher, Secretary, Academy, Student)
- [Enrollments Domain](/backend/domains/enrollments) - Enrollment model
- [Policies Overview](/backend/policies/) - BasePolicy pattern and registration
