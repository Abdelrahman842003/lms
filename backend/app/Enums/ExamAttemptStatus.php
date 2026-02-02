<?php

declare(strict_types=1);

namespace App\Enums;

enum ExamAttemptStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case TERMINATED = 'terminated';
}
