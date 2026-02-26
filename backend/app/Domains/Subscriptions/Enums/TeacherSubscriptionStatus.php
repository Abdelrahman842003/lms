<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Enums;

enum TeacherSubscriptionStatus: string
{
    case PENDING = 'pending';
    case PARTIAL = 'partial';
    case PAID = 'paid';
}
