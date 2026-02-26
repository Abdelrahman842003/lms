<?php

declare(strict_types=1);

namespace App\Domains\Auth\Enums;

enum OrganizationType: string
{
    case ACADEMY        = 'academy';
    case PRIVATE_SCHOOL = 'private_school';

    public function label(): string
    {
        return match($this) {
            self::ACADEMY        => 'مركز تعليمي',
            self::PRIVATE_SCHOOL => 'مدرسة خاصة',
        };
    }
}
