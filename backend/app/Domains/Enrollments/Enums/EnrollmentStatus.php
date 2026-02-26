<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Enums;

enum EnrollmentStatus: string
{
    case ACTIVE          = 'active';
    case SUSPENDED       = 'suspended';
    case EXPIRED         = 'expired';
    case BLOCKED_BY_PLAN = 'blocked_by_plan';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE          => 'نشط',
            self::SUSPENDED       => 'موقوف',
            self::EXPIRED         => 'منتهي',
            self::BLOCKED_BY_PLAN => 'محظور بسبب الباقة',
        };
    }

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }
}
