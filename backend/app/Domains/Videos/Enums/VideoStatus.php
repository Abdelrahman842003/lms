<?php

declare(strict_types=1);

namespace App\Domains\Videos\Enums;

enum VideoStatus: string
{
    case DRAFT = 'draft';
    case UPLOADING = 'uploading';
    case UPLOADED = 'uploaded';
    case PROCESSING = 'processing';
    case READY = 'ready';
    case SCHEDULED = 'scheduled';
    case PUBLISHED = 'published';
    case FAILED = 'failed';
    case DELETED = 'deleted';

    public function isAccessible(): bool
    {
        return $this === self::PUBLISHED;
    }
}
