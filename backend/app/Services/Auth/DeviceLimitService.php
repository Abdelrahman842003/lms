<?php

namespace App\Services\Auth;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\PersonalAccessToken;

class DeviceLimitService
{
    /**
     * Device limits per user type
     */
    const DEVICE_LIMITS = [
        'App\Models\Student' => 4,
        'App\Models\Teacher' => 2,
        'App\Models\Secretary' => 1,
        'App\Models\Admin' => null, // unlimited
    ];

    /**
     * Check if user can login from a new device
     * If at limit, removes oldest device to make room
     * 
     * @return array ['allowed' => bool, 'removed_device' => bool]
     */
    public function checkAndManageDevices(Model $user): array
    {
        $userType = get_class($user);
        $limit = self::DEVICE_LIMITS[$userType] ?? null;

        // No limit for this user type (e.g., admin)
        if ($limit === null) {
            return ['allowed' => true, 'removed_device' => false];
        }

        $activeTokens = $this->getActiveTokens($user);
        $currentCount = $activeTokens->count();

        // If at or over limit, remove oldest device
        if ($currentCount >= $limit) {
            $this->removeOldestDevice($user, $activeTokens);
            return ['allowed' => true, 'removed_device' => true];
        }

        return ['allowed' => true, 'removed_device' => false];
    }

    /**
     * Get active (non-expired) access tokens for user
     */
    protected function getActiveTokens(Model $user)
    {
        return PersonalAccessToken::where('tokenable_type', get_class($user))
            ->where('tokenable_id', $user->id)
            ->where('name', 'access_token')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Remove the oldest device (token) for user
     */
    protected function removeOldestDevice(Model $user, $tokens = null)
    {
        if ($tokens === null) {
            $tokens = $this->getActiveTokens($user);
        }

        $oldest = $tokens->first();
        if ($oldest) {
            // Also remove associated refresh token if exists
            PersonalAccessToken::where('tokenable_type', get_class($user))
                ->where('tokenable_id', $user->id)
                ->where('created_at', '<=', $oldest->created_at->addSecond())
                ->delete();
        }
    }

    /**
     * Get count of active devices for user
     */
    public function getActiveDevicesCount(Model $user): int
    {
        return $this->getActiveTokens($user)->count();
    }

    /**
     * Get device limit for user type
     */
    public function getDeviceLimit(Model $user): ?int
    {
        return self::DEVICE_LIMITS[get_class($user)] ?? null;
    }

    /**
     * Logout from all devices except current
     */
    public function logoutOtherDevices(Model $user, string $currentTokenId): int
    {
        return PersonalAccessToken::where('tokenable_type', get_class($user))
            ->where('tokenable_id', $user->id)
            ->where('id', '!=', $currentTokenId)
            ->delete();
    }

    /**
     * Logout from all devices
     */
    public function logoutAllDevices(Model $user): int
    {
        return PersonalAccessToken::where('tokenable_type', get_class($user))
            ->where('tokenable_id', $user->id)
            ->delete();
    }
}
