<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Enums;

enum QuestType: string
{
    case DAILY   = 'daily';
    case WEEKLY  = 'weekly';
    case MONTHLY = 'monthly';
    case SPECIAL = 'special';

    public function label(): string
    {
        return match($this) {
            self::DAILY   => 'يومية',
            self::WEEKLY  => 'أسبوعية',
            self::MONTHLY => 'شهرية',
            self::SPECIAL => 'خاصة',
        };
    }
}
