<?php

declare(strict_types=1);

namespace App\Enums;

enum AcademyBillingStatus: string
{
    case PENDING = 'pending';
    case PARTIAL = 'partial';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';
}
