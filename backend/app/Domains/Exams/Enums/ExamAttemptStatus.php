<?php

declare(strict_types=1);

namespace App\Domains\Exams\Enums;

enum ExamAttemptStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case COMPLETED   = 'completed';
    case TERMINATED  = 'terminated';
    case FLAGGED     = 'flagged';

    public function label(): string
    {
        return match($this) {
            self::IN_PROGRESS => 'جاري',
            self::COMPLETED   => 'مكتمل',
            self::TERMINATED  => 'منتهي قسراً',
            self::FLAGGED     => 'مشبوه',
        };
    }

    public function isFinished(): bool
    {
        return in_array($this, [self::COMPLETED, self::TERMINATED]);
    }
}
