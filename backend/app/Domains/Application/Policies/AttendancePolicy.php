<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Lectures\Models\Attendance;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Attendance model.
 *
 * Handles authorization for attendance tracking operations.
 */
class AttendancePolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'attendances';
    }

    public function viewAny($user): bool
    {
        // Admins, Teachers, Secretaries, and Academies can view attendance
        return $user instanceof Admin 
            || $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof Attendance) {
            return false;
        }

        // Admins can view any attendance
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own attendance
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view attendance for their lectures
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->lecture) {
            return $model->lecture->teacher_id === $teacher->id;
        }

        // Academy can view attendance for their lectures
        if ($user instanceof Academy && $model->lecture) {
            return $model->lecture->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create attendance
        return $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy
            || $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof Attendance) {
            return false;
        }

        // Admins can update any attendance
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can update attendance for their lectures
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->lecture) {
            return $model->lecture->teacher_id === $teacher->id;
        }

        // Academy can update attendance for their lectures
        if ($user instanceof Academy && $model->lecture) {
            return $model->lecture->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
