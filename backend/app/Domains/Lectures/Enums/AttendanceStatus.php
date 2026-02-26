<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Enums;

enum AttendanceStatus: string
{
    case PRESENT = 'present';
    case ABSENT  = 'absent';
    case LATE    = 'late';
    case EXCUSED = 'excused';

    public function label(): string
    {
        return match($this) {
            self::PRESENT => 'حاضر',
            self::ABSENT  => 'غائب',
            self::LATE    => 'متأخر',
            self::EXCUSED => 'مستأذن',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PRESENT => 'success',
            self::ABSENT  => 'danger',
            self::LATE    => 'warning',
            self::EXCUSED => 'info',
        };
    }
}
