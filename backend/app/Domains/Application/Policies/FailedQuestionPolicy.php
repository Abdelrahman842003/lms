<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Models\FailedQuestion;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for FailedQuestion model.
 *
 * Handles authorization for failed question (mistake) operations.
 */
class FailedQuestionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'failed-questions';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof FailedQuestion) {
            return false;
        }

        // Student owns their own failed questions
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        return false;
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view failed questions
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof FailedQuestion) {
            return false;
        }

        // Admins can view any failed question
        if ($user instanceof Admin) {
            return true;
        }

        // Students can view their own failed questions
        if ($user instanceof Student) {
            return $model->student_id === $user->id;
        }

        // Teacher/Secretary can view failed questions from their students
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->student) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->whereIn('teacher_profile_id', $teacher->profiles()->pluck('id'))
                ->exists();
        }

        // Academy can view failed questions from their students
        if ($user instanceof Academy && $model->student) {
            return \App\Domains\Enrollments\Models\Enrollment::where('student_id', $model->student_id)
                ->where('academy_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create($user): bool
    {
        // Failed questions are created automatically by the system
        return false;
    }

    public function update($user, Model $model): bool
    {
        // Failed questions are immutable
        return false;
    }

    public function delete($user, Model $model): bool
    {
        // Failed questions should not be deleted (learning record)
        return $user instanceof Admin;
    }
}
