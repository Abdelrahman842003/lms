<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق بعد منح نقاط XP لطالب → لتسجيل Transaction + تحديث Leaderboard.
 */
class XpGranted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int    $studentId,
        public readonly string $teacherId,
        public readonly int    $xp,
        public readonly string $type,       // 'exam' | 'attendance' | 'mistake_review'
        public readonly ?string $referenceId = null,
    ) {}
}
