<?php

declare(strict_types=1);

namespace App\Enums;

enum NotificationTargetType: string
{
    case TEACHERS = 'teachers';
    case SECRETARIES = 'secretaries';
    case ALL = 'all';
}
