<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentLogStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';
}
