<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Subscription types for unified subscription system
 */
enum SubscriptionType: string
{
    case TEACHER = 'teacher';
    case ACADEMY = 'academy';

    /**
     * Get Arabic label for the type
     */
    public function label(): string
    {
        return match($this) {
            self::TEACHER => 'مدرس',
            self::ACADEMY => 'أكاديمية',
        };
    }

    /**
     * Get the price setting key for this type
     */
    public function priceSettingKey(): string
    {
        return match($this) {
            self::TEACHER => 'pricePerStudent',
            self::ACADEMY => 'academy_student_price',
        };
    }
}