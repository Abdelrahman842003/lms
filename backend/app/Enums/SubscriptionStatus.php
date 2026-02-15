<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Subscription status for unified subscription system
 */
enum SubscriptionStatus: string
{
    case PENDING = 'pending';
    case PARTIAL = 'partial';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';

    /**
     * Get Arabic label for the status
     */
    public function label(): string
    {
        return match($this) {
            self::PENDING => 'غير مدفوع',
            self::PARTIAL => 'مدفوع جزئياً',
            self::PAID => 'مدفوع',
            self::CANCELLED => 'ملغي',
        };
    }

    /**
     * Get CSS color class for the status
     */
    public function color(): string
    {
        return match($this) {
            self::PENDING => 'warning',
            self::PARTIAL => 'info',
            self::PAID => 'success',
            self::CANCELLED => 'danger',
        };
    }
}