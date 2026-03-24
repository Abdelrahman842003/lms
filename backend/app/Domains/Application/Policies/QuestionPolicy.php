<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Models\Question;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Question model.
 *
 * Handles authorization for exam question operations.
 */
class QuestionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'questions';
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view questions
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof Question) {
            return false;
        }

        // Admins can view any question
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can view questions on their exams
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->exam) {
            return $model->exam->teacher_id === $teacher->id;
        }

        // Academy can view questions on their exams
        if ($user instanceof Academy && $model->exam) {
            return $model->exam->academy_id === $user->id;
        }

        // Students can view questions during exams
        return true;
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create questions
        return $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy
            || $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof Question) {
            return false;
        }

        // Admins can update any question
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can update questions on their exams
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->exam) {
            return $model->exam->teacher_id === $teacher->id;
        }

        // Academy can update questions on their exams
        if ($user instanceof Academy && $model->exam) {
            return $model->exam->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
