<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Enums;

enum SubscriptionStatus: string
{
    case ACTIVE    = 'active';
    case PENDING   = 'pending';
    case PARTIAL   = 'partial';
    case PAID      = 'paid';
    case EXPIRED   = 'expired';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE    => 'نشط',
            self::PENDING   => 'غير مدفوع',
            self::PARTIAL   => 'مدفوع جزئياً',
            self::PAID      => 'مدفوع',
            self::EXPIRED   => 'منتهي',
            self::CANCELLED => 'ملغي',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::ACTIVE    => 'success',
            self::PENDING   => 'warning',
            self::PARTIAL   => 'info',
            self::PAID      => 'success',
            self::EXPIRED   => 'danger',
            self::CANCELLED => 'secondary',
        };
    }
}
