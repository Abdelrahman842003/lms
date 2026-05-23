<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use App\Domains\Notifications\BaseNotification;

class LectureActivatedNotification extends BaseNotification
{
    public function __construct(
        private string $lectureTitle,
        private string $teacherName,
        private string $lectureId,
        private ?string $academyName = null,
    ) {}

    protected function getData(): array
    {
        if ($this->academyName) {
            $message = "تبلغكم أكاديمية {$this->academyName} بأنه تم تفعيل محاضرة: {$this->lectureTitle} للأستاذ {$this->teacherName}";
            $sender = $this->academyName;
        } else {
            $message = "تم تفعيل محاضرة: {$this->lectureTitle} بواسطة الأستاذ {$this->teacherName}";
            $sender = $this->teacherName;
        }

        return [
            'title'         => 'محاضرة جديدة متاحة',
            'message'       => $message,
            'sender_name'   => $sender,
            'type'          => 'lecture_activated',
            'lecture_id'    => $this->lectureId,
            'lecture_title' => $this->lectureTitle,
        ];
    }

    public function broadcastType(): string
    {
        return 'lecture_activated';
    }
}
