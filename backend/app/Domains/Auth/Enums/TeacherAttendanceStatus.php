<?php

declare(strict_types=1);

namespace App\Domains\Auth\Enums;

enum TeacherAttendanceStatus: string
{
    case CHECKED_IN = 'checked_in';
    case CHECKED_OUT = 'checked_out';
    case ABSENT = 'absent';
}
