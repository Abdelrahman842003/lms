---
title: VideoPolicy
description: Authorization policy for video resource access
---

# VideoPolicy

**File:** `backend/app/Domains/Videos/Policies/VideoPolicy.php`

Controls access to video resources with support for independent teachers, academy-owned videos, and secretary permissions with granular capability checks.

## Policy Methods

| Method | Description | Admin | Teacher | Academy | Secretary |
|--------|-------------|-------|---------|---------|-----------|
| `viewAny()` | List videos | Yes | Yes | Yes | Yes |
| `createIndependent()` | Create independent video | Yes | Independent active only | No | No |
| `createAcademy()` | Create academy video | Yes | No | Yes | With permissions |
| `view()` | View video | Yes | Own videos | Own videos | With permissions |
| `update()` | Update video | Yes | Own videos | Own videos | With permissions |
| `delete()` | Delete video | Yes | Own videos | Own videos | With permissions |
| `publish()` | Publish video | Yes | Own videos | Own videos | With permissions |
| `manageComments()` | Manage comments | Yes | Own videos | Own videos | With permissions |

## Owner Types

Videos use a polymorphic owner relationship via the `VideoOwnerType` enum:

- **INDEPENDENT_TEACHER**: Videos created by independent (non-academy) teachers
- **ACADEMY**: Videos owned by academy institutions

```php
// Owner type check
if ($user instanceof Teacher) {
    return $video->owner_type === VideoOwnerType::INDEPENDENT_TEACHER
        && $video->owner_id === $user->id;
}

if ($user instanceof Academy) {
    return $video->owner_type === VideoOwnerType::ACADEMY
        && $video->owner_id === $user->id;
}
```

## Authorization Logic

### Independent Teacher Access

Independent teachers must have an active independent subscription to create videos:

```php
public function createIndependent(Admin|Teacher $user): bool
{
    if ($user instanceof Admin) {
        return true;
    }

    return (bool) $user->is_independent_active;
}
```

### Academy Access

Academies have full access to create and manage their own videos:

```php
public function createAcademy(Admin|Academy|Secretary $user, ?string $academyId = null): bool
{
    if ($user instanceof Admin) return true;
    if ($user instanceof Academy) return true;
    // Secretaries: check via secretaryCan()
}
```

### View Authorization

The `view()` method is reused by other methods (`update`, `delete`, `publish`) as a base ownership check:

```php
public function update(Admin|Teacher|Academy|Secretary $user, Video $video): bool
{
    if (!$this->view($user, $video)) {
        return false;
    }

    if ($user instanceof Secretary) {
        return $this->secretaryCan($user, 'edit videos', $video->academy_id);
    }

    return true;
}
```

## Secretary Permissions

Secretary permissions use a layered fallback system that checks Spatie permissions first, then pivot table permissions:

```php
private function secretaryCan(Secretary $secretary, string $permission, ?string $academyId = null): bool
{
    // 1. Check Spatie permission
    try {
        if ($secretary->hasPermissionTo($permission, 'secretary')) {
            return true;
        }
    } catch (\Throwable) {
        // Fall back to JSON permissions from pivot.
    }

    // 2. Check academy pivot permissions
    $academyRecord = $secretary->academies()->first();
    $academyPermissions = (array) ($academyRecord?->pivot?->permissions ?? []);
    if (in_array($permission, $academyPermissions, true)) {
        return true;
    }

    // 3. Check teacher pivot permissions
    $teacherRecord = $secretary->teachers()->first();
    $teacherPermissions = (array) ($teacherRecord?->pivot?->permissions ?? []);

    return in_array($permission, $teacherPermissions, true);
}
```

### Secretary Permission Strings

| Permission String | Grants Access To |
|-------------------|-----------------|
| `create videos` | `createAcademy()` |
| `edit videos` | `update()` |
| `delete videos` | `delete()` |
| `publish videos` | `publish()` |

### Academy Membership Check

Secretaries must belong to the academy that owns the video:

```php
private function secretaryBelongsToAcademy(Secretary $secretary, string $academyId): bool
{
    return $secretary->academies()
        ->where('academies.id', $academyId)
        ->where('academy_secretary.is_active', true)
        ->exists();
}
```

## Method Signatures

```php
public function viewAny(Admin|Teacher|Academy|Secretary $user): bool
public function createIndependent(Admin|Teacher $user): bool
public function createAcademy(Admin|Academy|Secretary $user, ?string $academyId = null): bool
public function view(Admin|Teacher|Academy|Secretary $user, Video $video): bool
public function update(Admin|Teacher|Academy|Secretary $user, Video $video): bool
public function delete(Admin|Teacher|Academy|Secretary $user, Video $video): bool
public function publish(Admin|Teacher|Academy|Secretary $user, Video $video): bool
public function manageComments(Admin|Teacher|Academy|Secretary $user, Video $video): bool
```

## Usage

```php
// Creating independent teacher video
$this->authorize('createIndependent', Video::class);

// Creating academy video
$this->authorize('createAcademy', Video::class);

// Updating a video
$this->authorize('update', $video);

// Managing comments on a video
$this->authorize('manageComments', $video);
```

## Notes

- The VideoPolicy does **not** extend `BasePolicy` -- it implements its own authorization logic.
- The `manageComments()` method simply delegates to `view()`, meaning any user who can view the video can manage its comments.
- The `createAcademy()` method accepts an optional `$academyId` parameter to scope the secretary permission check to a specific academy.

## References

- [Videos Domain](/backend/domains/videos) - Video model and related resources
- [Auth Domain](/backend/domains/auth) - User models (Admin, Teacher, Academy, Secretary)
- [Policies Overview](/backend/policies/) - BasePolicy pattern and registration
