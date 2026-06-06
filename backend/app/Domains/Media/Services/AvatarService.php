<?php

declare(strict_types=1);

namespace App\Domains\Media\Services;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Admin;
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

    private function getImageKeyColumn(string $type): string
    {
        if ($type === 'academy') {
            return 'logo_key';
        }

        return 'avatar_key';
    }

    /**
     * Upload avatar for a user
     *
     * @param mixed        $user (Teacher|Student|Secretary|Guardian|Admin)
     * @param string       $type (teacher|student|secretary|parent|admin)
     * @param UploadedFile $file
     * @return array
     */
    public function uploadAvatar($user, string $type, UploadedFile $file): array
    {
        $imageKeyColumn = $this->getImageKeyColumn($type);

        // Check if the user model actually has this column
        if (!array_key_exists($imageKeyColumn, $user->getAttributes()) && !in_array($imageKeyColumn, $user->getFillable())) {
             throw new DomainException('User type does not support avatars');
        }

        // Delete old avatar if exists
        if ($user->{$imageKeyColumn}) {
            $this->deleteAvatar($user, $type);
        }

        // Generate filename
        $filename = $this->imageService->generateFilename($type . '_' . $user->id);

        // Process and upload image to R2
        // This returns the relative path, e.g. "avatars/filename.webp"
        $path = $this->imageService->processAndUpload($file, 'avatars', $filename);

        // Get public URL
        $url = $this->imageService->getUrl($path);

    // Update user's image key in database with the R2 PATH
        // We store the path so we can delete it later easily
    $user->update([$imageKeyColumn => $path]);

        return [
            'url' => $url,
            'key' => $path,
        ];
    }

    /**
     * Delete avatar for a user
     *
     * @param mixed  $user (Teacher|Student|Secretary|Guardian|Admin)
     * @param string $type (teacher|student|secretary|parent|admin)
     * @return bool
     */
    public function deleteAvatar($user, string $type): bool
    {
        $imageKeyColumn = $this->getImageKeyColumn($type);

        if (!$user->{$imageKeyColumn}) {
            return true;
        }

        // The image key now holds the R2 path
        $path = $user->{$imageKeyColumn};

        // Delete from R2
        $this->imageService->delete($path);

    // Clear image key from database
    $user->update([$imageKeyColumn => null]);

        return true;
    }

    /**
     * Get avatar URL for a user
     *
     * @param mixed  $user (Teacher|Student|Secretary|Guardian|Admin)
     * @param string $type (teacher|student|secretary|parent|admin)
     * @return string|null
     */
    public function getAvatarUrl($user, string $type): ?string
    {
        $imageKeyColumn = $this->getImageKeyColumn($type);

        // Check if attribute exists on the model
        try {
            if (!isset($user->{$imageKeyColumn})) {
                return null;
            }
        } catch (\Exception $e) {
            return null;
        }

        if (!$user->{$imageKeyColumn}) {
            return null;
        }

        // The image key holds the path, we need to convert it to a full URL
        return $this->imageService->getUrl($user->{$imageKeyColumn});
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
        } elseif ($user instanceof Academy) {
            return 'academy';
        } elseif ($user instanceof Admin) {
            return 'admin';
        }

        throw new DomainException('Invalid user type');
    }
}
