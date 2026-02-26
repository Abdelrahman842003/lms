<?php

declare(strict_types=1);

namespace App\Domains\Media\Services;

use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Http\UploadedFile;

class AvatarService
{
    private ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Upload avatar for a user
     *
     * @param mixed        $user (Teacher|Student|Secretary|Guardian)
     * @param string       $type (teacher|student|secretary|parent)
     * @param UploadedFile $file
     * @return array
     */
    public function uploadAvatar($user, string $type, UploadedFile $file): array
    {
        // Delete old avatar if exists
        if ($user->avatar_key) {
            $this->deleteAvatar($user, $type);
        }

        // Generate filename
        $filename = $this->imageService->generateFilename($type . '_' . $user->id);

        // Process and upload image to R2
        // This returns the relative path, e.g. "avatars/filename.webp"
        $path = $this->imageService->processAndUpload($file, 'avatars', $filename);

        // Get public URL
        $url = $this->imageService->getUrl($path);

        // Update user's avatar_key in database with the R2 PATH
        // We store the path so we can delete it later easily
        $user->update(['avatar_key' => $path]);

        return [
            'url' => $url,
            'key' => $path,
        ];
    }

    /**
     * Delete avatar for a user
     *
     * @param mixed  $user (Teacher|Student|Secretary|Guardian)
     * @param string $type (teacher|student|secretary|parent)
     * @return bool
     */
    public function deleteAvatar($user, string $type): bool
    {
        if (!$user->avatar_key) {
            return true;
        }

        // The avatar_key now holds the R2 path
        $path = $user->avatar_key;

        // Delete from R2
        $this->imageService->delete($path);

        // Clear avatar_key from database
        $user->update(['avatar_key' => null]);

        return true;
    }

    /**
     * Get avatar URL for a user
     *
     * @param mixed  $user (Teacher|Student|Secretary|Guardian)
     * @param string $type (teacher|student|secretary|parent)
     * @return string|null
     */
    public function getAvatarUrl($user, string $type): ?string
    {
        if (!$user->avatar_key) {
            return null;
        }

        // The avatar_key holds the path, we need to convert it to a full URL
        return $this->imageService->getUrl($user->avatar_key);
    }

    /**
     * Detect user type from authenticated user
     *
     * @param mixed $user
     * @return string
     */
    public static function detectUserType($user): string
    {
        if ($user instanceof Teacher) {
            return 'teacher';
        } elseif ($user instanceof Student) {
            return 'student';
        } elseif ($user instanceof Secretary) {
            return 'secretary';
        } elseif ($user instanceof Guardian) {
            return 'parent';
        }

        throw new \Exception('Invalid user type');
    }
}
