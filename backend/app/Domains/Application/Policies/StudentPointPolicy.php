<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Gamification\Models\StudentPoint;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for StudentPoint model.
 *
 * Handles authorization for student points operations.
 */
class StudentPointPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'student-points';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof StudentPoint) {
            return false;
        }

        // Student owns their own points
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view points
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof StudentPoint) {
            return false;
        }

        // Admins can view any points
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own points
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view points for their students
        $teacher = $this->resolveTeacher($user);
        if ($teacher) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->where('teacher_id', $teacher->id)
                ->exists();
        }

        // Academy can view points for their students
        if ($user instanceof Academy) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create($user): bool
    {
        // Points are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Points are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Points should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
