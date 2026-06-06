<?php

declare(strict_types=1);

namespace App\Domains\Exams\Policies;

use App\Domains\Application\Policies\BasePolicy;
use App\Domains\Exams\Models\Exam;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for Exam model.
 *
 * Centralizes authorization logic for exam CRUD, results viewing, and copying.
 * Supports Teacher, Secretary, and Academy users.
 */
class ExamPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'exams';
    }

    /**
     * Determine whether the user can view the exam.
     */
    public function view($user, Model $model): bool
    {
        if (!$model instanceof Exam) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can update the exam.
     */
    public function update($user, Model $model): bool
    {
        if (!$model instanceof Exam) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can delete the exam.
     */
    public function delete($user, Model $model): bool
    {
        if (!$model instanceof Exam) {
            return false;
        }
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $model->teacher_profile_id);
    }

    /**
     * Determine whether the user can view exam results.
     */
    public function viewResults($user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $exam->teacher_profile_id);
    }

    /**
     * Determine whether the user can copy the exam.
     */
    public function copy($user, Exam $exam): bool
    {
        $teacher = $this->resolveTeacher($user);
        return $teacher && $this->ownsProfileResource($teacher, $exam->teacher_profile_id);
    }
}

