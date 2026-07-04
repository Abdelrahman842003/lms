<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Enums;

enum PaymentTransactionStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case REJECTED = 'rejected';
    case EXPIRED = 'expired';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'معلق',
            self::CONFIRMED => 'مؤكد',
            self::REJECTED => 'مرفوض',
            self::EXPIRED => 'منتهي الصلاحية',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'warning',
            self::CONFIRMED => 'success',
            self::REJECTED => 'danger',
            self::EXPIRED => 'gray',
        };
    }
}
