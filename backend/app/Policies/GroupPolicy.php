<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Group;
use App\Models\Teacher;
use App\Models\Secretary;

/**
 * Authorization policy for Group model.
 *
 * Centralizes authorization logic for group CRUD operations,
 * supporting both Teacher and Secretary users via resolveTeacher().
 */
class GroupPolicy
{
    /**
     * Resolve the effective teacher from the user.
     */
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

    /**
     * Determine whether the user can view the group.
     */
    public function view(Teacher|Secretary $user, Group $group): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $group->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can update the group.
     */
    public function update(Teacher|Secretary $user, Group $group): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $group->teacher_id === $teacher->id;
    }

    /**
     * Determine whether the user can delete the group.
     */
    public function delete(Teacher|Secretary $user, Group $group): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $group->teacher_id === $teacher->id;
    }
}
