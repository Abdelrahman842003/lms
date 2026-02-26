<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Enums;

enum SubscriptionType: string
{
    case TEACHER = 'teacher';
    case ACADEMY = 'academy';

    public function label(): string
    {
        return match($this) {
            self::TEACHER => 'مدرس',
            self::ACADEMY => 'أكاديمية',
        };
    }

    public function priceSettingKey(): string
    {
        return match($this) {
            self::TEACHER => 'pricePerStudent',
            self::ACADEMY => 'academy_student_price',
        };
    }
}
