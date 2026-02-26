<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Enums;

enum LectureStatus: string
{
    case SCHEDULED = 'scheduled';
    case ACTIVE    = 'active';
    case CLOSED    = 'closed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::SCHEDULED => 'مجدولة',
            self::ACTIVE    => 'نشطة',
            self::CLOSED    => 'منتهية',
            self::CANCELLED => 'ملغاة',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::SCHEDULED => 'info',
            self::ACTIVE    => 'success',
            self::CLOSED    => 'secondary',
            self::CANCELLED => 'danger',
        };
    }
}
