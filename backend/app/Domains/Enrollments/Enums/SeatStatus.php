<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Enums;

enum SeatStatus: string
{
    case ACTIVE    = 'active';
    case SUSPENDED = 'suspended';
    case RELEASED  = 'released';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE    => 'نشط',
            self::SUSPENDED => 'موقوف',
            self::RELEASED  => 'محرر',
        };
    }
}
