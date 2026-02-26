<?php

declare(strict_types=1);

namespace App\Domains\Exams\Enums;

enum ExamStatus: string
{
    case DRAFT     = 'draft';
    case ACTIVE    = 'active';
    case CLOSED    = 'closed';

    public function label(): string
    {
        return match($this) {
            self::DRAFT  => 'مسودة',
            self::ACTIVE => 'نشط',
            self::CLOSED => 'منتهي',
        };
    }
}
