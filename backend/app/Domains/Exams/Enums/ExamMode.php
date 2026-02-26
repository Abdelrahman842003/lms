<?php

declare(strict_types=1);

namespace App\Domains\Exams\Enums;

enum ExamMode: string
{
    case PRACTICE  = 'practice';
    case EXAM      = 'exam';
    case HOMEWORK  = 'homework';

    public function label(): string
    {
        return match($this) {
            self::PRACTICE => 'تدريب',
            self::EXAM     => 'امتحان',
            self::HOMEWORK => 'واجب',
        };
    }
}
