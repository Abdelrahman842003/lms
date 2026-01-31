<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Models\LoginAttempt;
use Carbon\Carbon;

class LoginAttemptService
{
    /**
     * Maximum failed attempts before ban
     */
    const MAX_ATTEMPTS = 4;
    
    /**
     * Ban durations in minutes (escalating)
     * First ban: 1 min, second: 5 min, third: 10 min, etc.
     */
    const BAN_DURATIONS = [1, 5, 10, 30, 60];

    /**
     * Record a failed login attempt
     */
    public function recordFailedAttempt(string $identifier, string $ip): array
    {
        $record = LoginAttempt::firstOrCreate(
            ['identifier' => $identifier, 'ip_address' => $ip],
            ['attempts' => 0, 'ban_level' => 0]
        );

        $record->increment('attempts');

        // Check if we've reached max attempts
        if ($record->attempts >= self::MAX_ATTEMPTS) {
            return $this->applyBan($record);
        }

        return [
            'banned' => false,
            'attempts_remaining' => self::MAX_ATTEMPTS - $record->attempts,
        ];
    }

    /**
     * Apply ban and escalate ban level
     */
    protected function applyBan(LoginAttempt $record): array
    {
        $banLevel = $record->ban_level;
        $banDuration = self::BAN_DURATIONS[min($banLevel, count(self::BAN_DURATIONS) - 1)];
        
        $record->update([
            'ban_level' => $banLevel + 1,
            'attempts' => 0, // Reset attempts for next cycle
            'banned_until' => Carbon::now()->addMinutes($banDuration),
        ]);

        return [
            'banned' => true,
            'ban_duration_minutes' => $banDuration,
            'banned_until' => $record->banned_until,
        ];
    }

    /**
     * Check if identifier/IP is currently blocked
     */
    public function isBlocked(string $identifier, string $ip): bool
    {
        $record = LoginAttempt::where('identifier', $identifier)
            ->where('ip_address', $ip)
            ->first();

        if (!$record || !$record->banned_until) {
            return false;
        }

        return $record->banned_until->isFuture();
    }

    /**
     * Get remaining ban time in seconds
     */
    public function getRemainingBanTime(string $identifier, string $ip): int
    {
        $record = LoginAttempt::where('identifier', $identifier)
            ->where('ip_address', $ip)
            ->first();

        if (!$record || !$record->banned_until || $record->banned_until->isPast()) {
            return 0;
        }

        return max(0, $record->banned_until->diffInSeconds(Carbon::now()));
    }

    /**
     * Clear attempts on successful login
     */
    public function clearAttempts(string $identifier, string $ip): void
    {
        LoginAttempt::where('identifier', $identifier)
            ->where('ip_address', $ip)
            ->update([
                'attempts' => 0,
                // Note: We keep ban_level for escalating future bans
            ]);
    }

    /**
     * Full reset (clear attempts and ban level)
     * Use this for admin password resets
     */
    public function fullReset(string $identifier, string $ip): void
    {
        LoginAttempt::where('identifier', $identifier)
            ->where('ip_address', $ip)
            ->delete();
    }
}
