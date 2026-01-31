<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentDeviceToken extends Model
{
    protected $fillable = [
        'parent_phone',
        'token',
        'device_type',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    /**
     * Get all device tokens for a parent phone
     */
    public static function getTokensForPhone(string $parentPhone): array
    {
        return self::where('parent_phone', $parentPhone)
            ->pluck('token')
            ->toArray();
    }

    /**
     * Store or update a token for a parent
     */
    public static function storeToken(string $parentPhone, string $token, string $deviceType = 'web'): self
    {
        return self::firstOrCreate(
            ['token' => $token],
            [
                'parent_phone' => $parentPhone,
                'device_type' => $deviceType,
                'last_used_at' => now(),
            ]
        );
    }

    /**
     * Remove a token
     */
    public static function removeToken(string $token): void
    {
        self::where('token', $token)->delete();
    }

    /**
     * Remove all tokens for a parent
     */
    public static function removeAllForPhone(string $parentPhone): void
    {
        self::where('parent_phone', $parentPhone)->delete();
    }
}
