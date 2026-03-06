<?php

declare(strict_types=1);

namespace App\Domains\Videos\Enums;

enum VideoProcessingStatus: string
{
    case PENDING = 'pending';
    case RUNNING = 'running';
    case SUCCEEDED = 'succeeded';
    case FAILED = 'failed';
}
