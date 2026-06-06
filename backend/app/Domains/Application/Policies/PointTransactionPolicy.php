<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Gamification\Models\PointTransaction;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for PointTransaction model.
 *
 * Handles authorization for point transaction operations.
 */
class PointTransactionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'point-transactions';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof PointTransaction) {
            return false;
        }

        // Student owns their own transactions
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view transactions
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof PointTransaction) {
            return false;
        }

        // Admins can view any transaction
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own transactions
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view transactions for their students
        $teacher = $this->resolveTeacher($user);
        if ($teacher) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->whereIn('teacher_profile_id', $teacher->profiles()->pluck('id'))
                ->exists();
        }

        // Academy can view transactions for their students
        if ($user instanceof Academy) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create($user): bool
    {
        // Transactions are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Transactions are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Transactions should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
