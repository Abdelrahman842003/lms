<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Application\Models\TeacherAttendanceLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for TeacherAttendanceLog model.
 *
 * Handles authorization for teacher attendance log operations.
 */
class TeacherAttendanceLogPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'teacher-attendance-logs';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof TeacherAttendanceLog) {
            return false;
        }

        // Teacher owns their own attendance logs
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins and Teachers can view attendance logs
        return $user instanceof Admin || $user instanceof Teacher;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof TeacherAttendanceLog) {
            return false;
        }

        // Admins can view any log
        if ($user instanceof Admin) {
            return true;
        }

        // Teachers can view their own logs
        if ($user instanceof Teacher) {
            return $model->teacher_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Attendance logs are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Attendance logs are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Attendance logs should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
