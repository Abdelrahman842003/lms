<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Enums;

enum PeriodType: string
{
    case MONTHLY  = 'monthly';
    case YEARLY   = 'yearly';
    case ONE_TIME = 'one_time';
    case CUSTOM   = 'custom';

    public function label(): string
    {
        return match($this) {
            self::MONTHLY  => 'شهري',
            self::YEARLY   => 'سنوي',
            self::ONE_TIME => 'مرة واحدة',
            self::CUSTOM   => 'مخصص',
        };
    }
}
