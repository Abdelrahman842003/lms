<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\StudentActivityLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for StudentActivityLog model.
 *
 * Handles authorization for student activity log operations.
 */
class StudentActivityLogPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'student-activity-logs';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof StudentActivityLog) {
            return false;
        }

        // Student owns their own activity logs
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // Admins, Teachers, and Academies can view activity logs
        return $user instanceof Admin 
            || $user instanceof Teacher 
            || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof StudentActivityLog) {
            return false;
        }

        // Admins can view any log
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own logs
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view logs for their students
        $teacher = $this->resolveTeacher($user);
        if ($teacher) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->whereIn('teacher_profile_id', $teacher->profiles()->pluck('id'))
                ->exists();
        }

        // Academy can view logs for their students
        if ($user instanceof Academy) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create($user): bool
    {
        // Activity logs are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Activity logs are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Activity logs should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
