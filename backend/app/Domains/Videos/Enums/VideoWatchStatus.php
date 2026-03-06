<?php

declare(strict_types=1);

namespace App\Domains\Videos\Enums;

enum VideoWatchStatus: string
{
    case NOT_STARTED = 'not_started';
    case STARTED = 'started';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
}
