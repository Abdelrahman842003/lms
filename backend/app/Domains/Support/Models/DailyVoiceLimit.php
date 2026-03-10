<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Domains\Auth\Models\Admin;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DailyVoiceLimit extends Model
{
    use HasUuids;

    protected $fillable = [
        'limitable_type',
        'limitable_id',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * Get the parent limitable model (teacher, student, etc.)
     */
    public function limitable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Check if a user has used their daily voice limit
     */
    public static function hasUsedToday($user): bool
    {
        return self::where('limitable_type', get_class($user))
            ->where('limitable_id', $user->id)
            ->where('date', now()->toDateString())
            ->exists();
    }

    /**
     * Mark a user as having used their daily voice limit
     */
    public static function markAsUsed($user): self
    {
        return self::create([
            'limitable_type' => get_class($user),
            'limitable_id' => $user->id,
            'date' => now()->toDateString(),
        ]);
    }

    /**
     * Check if user can send voice notification
     * Admins have no limit
     */
    public static function canSendVoice($user): bool
    {
        // Admins have unlimited voice notifications
        if ($user instanceof Admin) {
            return true;
        }

        return !self::hasUsedToday($user);
    }
}
