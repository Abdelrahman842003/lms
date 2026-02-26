<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Enums;

enum AnnouncementContentType: string
{
    case TEXT  = 'text';
    case IMAGE = 'image';
    case VIDEO = 'video';
    case VOICE = 'voice';
    case FILE  = 'file';

    public function label(): string
    {
        return match($this) {
            self::TEXT  => 'نص',
            self::IMAGE => 'صورة',
            self::VIDEO => 'فيديو',
            self::VOICE => 'صوت',
            self::FILE  => 'ملف',
        };
    }
}
