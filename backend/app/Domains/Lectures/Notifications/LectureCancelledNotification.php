<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use App\Domains\Notifications\BaseNotification;

class LectureCancelledNotification extends BaseNotification
{
    public function __construct(
        protected string $lectureTitle,
        protected string $teacherName,
    ) {}

    protected function getData(): array
    {
        return [
            'title'   => 'تم إلغاء المحاضرة',
            'message' => "تم إلغاء محاضرة {$this->lectureTitle} بواسطة الأستاذ {$this->teacherName}",
            'type'    => 'lecture_cancelled',
        ];
    }

    public function broadcastType(): string
    {
        return 'lecture_cancelled';
    }
}
