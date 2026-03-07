<?php

declare(strict_types=1);

namespace App\Domains\Videos\Enums;

enum VideoUploadSessionStatus: string
{
    case PENDING_UPLOAD = 'pending_upload';
    case UPLOADING      = 'uploading';
    case COMPLETING     = 'completing';
    case COMPLETED      = 'completed';
    case ABORTED        = 'aborted';
    case FAILED         = 'failed';

    public function isTerminal(): bool
    {
        return in_array($this, [self::COMPLETED, self::ABORTED, self::FAILED], true);
    }
}
