<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Enums;

enum PaymentMethod: string
{
    case ADMIN = 'admin';
    case INSTAPAY = 'instapay';
    case VODAFONE_CASH = 'vodafone_cash';

    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'أدمين',
            self::INSTAPAY => 'إنستاباي',
            self::VODAFONE_CASH => 'فودافون كاش',
        };
    }

    public function isSelfService(): bool
    {
        return match($this) {
            self::ADMIN => false,
            self::INSTAPAY, self::VODAFONE_CASH => true,
        };
    }
}
