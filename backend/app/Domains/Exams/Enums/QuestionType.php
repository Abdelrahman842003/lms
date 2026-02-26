<?php

declare(strict_types=1);

namespace App\Domains\Exams\Enums;

enum QuestionType: string
{
    case MCQ       = 'mcq';       // اختيار من متعدد
    case TRUE_FALSE = 'true_false'; // صح أو غلط
    case ESSAY     = 'essay';     // مقالي

    public function label(): string
    {
        return match($this) {
            self::MCQ        => 'اختيار من متعدد',
            self::TRUE_FALSE => 'صح أو غلط',
            self::ESSAY      => 'مقالي',
        };
    }

    public function isAutoGraded(): bool
    {
        return in_array($this, [self::MCQ, self::TRUE_FALSE]);
    }
}
