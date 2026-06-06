<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Models\ExamResult;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for ExamResult model.
 *
 * Handles authorization for exam result operations.
 */
class ExamResultPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'exam-results';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof ExamResult) {
            return false;
        }

        // Student owns their own results
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view results
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof ExamResult) {
            return false;
        }

        // Admins can view any result
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own results
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view results on their exams
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->exam) {
            return $this->ownsProfileResource($teacher, $model->exam->teacher_profile_id);
        }

        // Academy can view results on their exams
        if ($user instanceof Academy && $model->exam) {
            return $model->exam->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Results are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Results are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Results should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
