<?php

declare(strict_types=1);

namespace App\Enums;

enum TeacherStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case PENDING = 'pending';
}
