<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Enums;

enum AttendanceMethod: string
{
    case QR_CODE  = 'qr_code';
    case MANUAL   = 'manual';
    case AUTO     = 'auto';

    public function label(): string
    {
        return match($this) {
            self::QR_CODE => 'QR Code',
            self::MANUAL  => 'يدوي',
            self::AUTO    => 'تلقائي',
        };
    }
}
