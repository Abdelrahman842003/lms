<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Models\StudentAnswer;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for StudentAnswer model.
 *
 * Handles authorization for student answer operations.
 */
class StudentAnswerPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'student-answers';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof StudentAnswer) {
            return false;
        }

        // Student owns their own answers
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view answers
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof StudentAnswer) {
            return false;
        }

        // Admins can view any answer
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own answers
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view answers on their exams
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->exam) {
            return $model->exam->teacher_id === $teacher->id;
        }

        // Academy can view answers on their exams
        if ($user instanceof Academy && $model->exam) {
            return $model->exam->academy_id === $user->id;
        }

        return false;
    }

    public function create($user): bool
    {
        // Only students can create answers
        return $user instanceof Student;
    }

    public function update($user, Model $model): bool
    {
        // Answers are immutable after submission
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Answers should not be deleted (audit trail)
        return $user instanceof Admin;
    }
}
