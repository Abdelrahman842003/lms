<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Enums;

enum StudentAttendanceStatus: string
{
    case PRESENT = 'present';
    case ABSENT = 'absent';
    case LATE = 'late';
}
