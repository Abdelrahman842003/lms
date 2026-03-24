<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\Models\VideoAttachment;
use Illuminate\Database\Eloquent\Model;

/**
 * Authorization policy for VideoAttachment model.
 *
 * Handles authorization for video attachment operations.
 */
class VideoAttachmentPolicy extends BasePolicy
{
    protected function getResourceName(): string
    {
        return 'video-attachments';
    }

    public function viewAny($user): bool
    {
        // All authenticated users can view attachments list
        return true;
    }

    public function view($user, Model $model): bool
    {
        if (!$model instanceof VideoAttachment) {
            return false;
        }

        // If video exists, check video access
        if ($model->video) {
            // Teacher/Secretary can view their video attachments
            $teacher = $this->resolveTeacher($user);
            if ($teacher) {
                return $model->video->teacher_id === $teacher->id;
            }

            // Academy can view their academy's video attachments
            if ($user instanceof Academy) {
                return $model->video->academy_id === $user->id;
            }
        }

        return true; // Allow if no video relation or other cases
    }

    public function create($user): bool
    {
        // Teachers, Secretaries, and Academies can create attachments
        return $user instanceof Teacher || $user instanceof Secretary || $user instanceof Academy;
    }

    public function update($user, Model $model): bool
    {
        if (!$model instanceof VideoAttachment) {
            return false;
        }

        // Teacher/Secretary can update their video attachments
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can update their academy's video attachments
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }

    public function delete($user, Model $model): bool
    {
        if (!$model instanceof VideoAttachment) {
            return false;
        }

        // Teacher/Secretary can delete their video attachments
        $teacher = $this->resolveTeacher($user);
        if ($teacher && $model->video) {
            return $model->video->teacher_id === $teacher->id;
        }

        // Academy can delete their academy's video attachments
        if ($user instanceof Academy && $model->video) {
            return $model->video->academy_id === $user->id;
        }

        return false;
    }
}
