<?php

declare(strict_types=1);

namespace App\Domains\Auth\Enums;

enum TeacherStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case PENDING = 'pending';
}
