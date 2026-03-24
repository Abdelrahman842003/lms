<?php

declare(strict_types=1);

namespace App\Domains\Support\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Models\ExamAttempt;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for ExamAttempt model.
 *
 * Handles authorization for exam attempt operations.
 */
class ExamAttemptPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'exam-attempts';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof ExamAttempt) {
            return false;
        }

        // Student owns their own attempts
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view attempts
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof ExamAttempt) {
            return false;
        }

        // Admins can view any attempt
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own attempts
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view attempts on their exams
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->exam) {
            return $model->exam->teacher_id === $teacher->id;
        }

        // Academy can view attempts on their exams
        if ($user instanceof Academy && $model->exam) {
            return $model->exam->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Only students can create attempts
        return $user instanceof Student;
    }

    public function update($user, Model $model): bool
    {
        // Attempts are immutable after submission
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Attempts should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
