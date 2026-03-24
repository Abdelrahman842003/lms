<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoQuizAttempt;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoQuizAttempt model.
 *
 * Handles authorization for video quiz attempt operations.
 */
class VideoQuizAttemptPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-quiz-attempts';
    }

    protected function ownsResource($user, Model $model): bool
    {
        if (!$model instanceof VideoQuizAttempt) {
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
        if (!$model instanceof VideoQuizAttempt) {
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

        // Teacher/Secretary can view attempts on their videos
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->quiz && $model->quiz->video) {
            return $model->quiz->video->teacher_id === $teacher->id;
        }

        // Academy can view attempts on their videos
        if ($user instanceof Academy && $model->quiz && $model->quiz->video) {
            return $model->quiz->video->academy_id === $user->id;
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
