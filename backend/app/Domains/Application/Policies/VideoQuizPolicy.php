<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoQuiz;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoQuiz model.
 *
 * Handles authorization for video quiz operations.
 */
class VideoQuizPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-quizzes';
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view quizzes
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoQuiz) {
            return false;
        }

        // Admins can view any quiz
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can view quizzes on their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $this->ownsProfileResource($teacher, $model->video->teacher_profile_id);
        }

        // Academy can view quizzes on their videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        // Students can view quizzes on videos they have access to
        return true;
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create quizzes
        return $user instanceof Teacher 
            || $user instanceof Secretary 
            || $user instanceof Academy
            || $user instanceof Admin;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof VideoQuiz) {
            return false;
        }

        // Admins can update any quiz
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can update quizzes on their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $this->ownsProfileResource($teacher, $model->video->teacher_profile_id);
        }

        // Academy can update quizzes on their videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoQuiz) {
            return false;
        }

        // Admins can delete any quiz
        if ($user instanceof Admin) {
            return true;
        }

        // Teacher/Secretary can delete quizzes on their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $this->ownsProfileResource($teacher, $model->video->teacher_profile_id);
        }

        // Academy can delete quizzes on their videos
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }
}
