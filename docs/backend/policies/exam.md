---
title: ExamPolicy
description: Authorization policy for exam resource access
---

# ExamPolicy

**File:** `backend/app/Domains/Exams/Policies/ExamPolicy.php`

Controls access to exam resources for teachers and secretaries. Uses owner-based authorization where teachers can only manage exams they created.

## Policy Methods

| Method | Description | Teacher | Secretary |
|--------|-------------|---------|-----------|
| `view()` | View exam | Own exams | Assigned teacher's exams |
| `update()` | Update exam | Own exams | Assigned teacher's exams |
| `delete()` | Delete exam | Own exams | Assigned teacher's exams |
| `viewResults()` | View exam results | Own exams | Assigned teacher's exams |
| `copy()` | Copy exam | Own exams | Assigned teacher's exams |

## Authorization Logic

### Owner-Based Access

All policy methods follow the same owner-check pattern. Teachers can only access exams they created:

```php
public function view(Teacher|Secretary $user, Exam $exam): bool
{
    $teacher = $this->resolveTeacher($user);
    return $teacher && $exam->teacher_id === $teacher->id;
}
```

This check is consistent across all methods (`view`, `update`, `delete`, `viewResults`, `copy`), ensuring that only the exam's creator (or their delegated secretary) can perform any action on it.

### Secretary Support

Secretaries access exams through their assigned teacher using the `resolveTeacher()` method:

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

This pattern allows secretaries to manage exams on behalf of their associated teacher, maintaining consistent authorization logic across user types.

## Method Signatures

```php
public function view(Teacher|Secretary $user, Exam $exam): bool
public function update(Teacher|Secretary $user, Exam $exam): bool
public function delete(Teacher|Secretary $user, Exam $exam): bool
public function viewResults(Teacher|Secretary $user, Exam $exam): bool
public function copy(Teacher|Secretary $user, Exam $exam): bool
```

## Usage

```php
// In controller
$this->authorize('update', $exam);
$this->authorize('viewResults', $exam);
$this->authorize('copy', $exam);

// Via Gate facade
Gate::authorize('delete', $exam);

// Check without throwing
if (Gate::allows('view', $exam)) {
    // proceed
}
```

## Notes

- The ExamPolicy does **not** extend `BasePolicy` -- it is a standalone policy without a `before()` hook for admin bypass.
- Admin access to exams is handled separately through the admin guard and Filament admin panel.
- Unlike some other policies (e.g., StudentPolicy, VideoPolicy), the ExamPolicy does not define a `create()` method. Exam creation authorization is handled at the controller or form request level.

## References

- [Exams Domain](/backend/domains/exams) - Exam model and related resources
- [Policies Overview](/backend/policies/) - BasePolicy pattern and registration
