<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoQuizQuestion;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoQuizQuestion model.
 *
 * Handles authorization for video quiz question operations.
 */
class VideoQuizQuestionPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-quiz-questions';
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view questions
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoQuizQuestion) {
            return false;
        }

        // Access is determined by the quiz's video ownership
        if ($model->quiz && $model->quiz->video) {
            $video = $model->quiz->video;

            // Admins can view any question
            if ($user instanceof Admin) {
                return true;
            }

            // Teacher/Secretary can view questions on their videos
            $teacher = $this->resolveTeacher($user);
            if ($teacher) {
                return $video->teacher_id === $teacher->id;
            }

            // Academy can view questions on their videos
            if ($user instanceof Academy) {
                return $video->academy_id === $user->id;
            }
        }

        return true; // Students can view questions during quiz
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
        if (!$model instanceof VideoQuizQuestion) {
            return false;
        }

        // Admins can update any question
        if ($user instanceof Admin) {
            return true;
        }

        // Check video ownership through quiz
        if ($model->quiz && $model->quiz->video) {
            $video = $model->quiz->video;

            // Teacher/Secretary can update questions on their videos
            $teacher = $this->resolveTeacher($user);
            if ($teacher) {
                return $video->teacher_id === $teacher->id;
            }

            // Academy can update questions on their videos
            if ($user instanceof Academy) {
                return $video->academy_id === $user->id;
            }
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        return $this->update($user, $model);
    }
}
