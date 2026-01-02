<?php

declare(strict_types=1);

namespace App\Notifications;

class LectureActivatedNotification extends BaseNotification
{
    public function __construct(
        private string $lectureTitle,
        private string $teacherName,
        private string $lectureId
    ) {}

    protected function getData(): array
    {
        return [
            'title' => 'محاضرة جديدة متاحة',
            'message' => "تم تفعيل محاضرة: {$this->lectureTitle} بواسطة {$this->teacherName}",
            'sender_name' => $this->teacherName,
            'type' => 'lecture_activated',
            'lecture_id' => $this->lectureId,
            'lecture_title' => $this->lectureTitle,
        ];
    }

    public function broadcastType(): string
    {
        return 'lecture_activated';
    }
}

