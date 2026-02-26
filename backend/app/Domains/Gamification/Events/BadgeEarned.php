<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عندما يحقق الطالب إنجازاً (badge) جديداً.
 */
class BadgeEarned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int    $studentId,
        public readonly string $teacherId,
        public readonly string $badgeType,  // 'streak_5' | 'streak_10' | 'perfect_month' | ...
        public readonly ?string $description = null,
    ) {}
}
