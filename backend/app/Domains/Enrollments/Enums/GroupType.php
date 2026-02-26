<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Enums;

enum GroupType: string
{
    case PUBLIC  = 'public';
    case PRIVATE = 'private';

    public function label(): string
    {
        return match($this) {
            self::PUBLIC  => 'عام',
            self::PRIVATE => 'خاص',
        };
    }
}
