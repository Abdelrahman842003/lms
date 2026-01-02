<?php

declare(strict_types=1);

namespace App\Notifications;

class StudentAbsentNotification extends BaseNotification
{
    public function __construct(
        private string $lectureTitle,
        private string $teacherName
    ) {}

    protected function getData(): array
    {
        return [
            'title' => 'تسجيل غياب',
            'message' => "لقد تم تسجيلك غائب في محاضرة: {$this->lectureTitle} للمدرس {$this->teacherName}",
            'type' => 'absent',
            'lecture_title' => $this->lectureTitle,
            'teacher_name' => $this->teacherName,
        ];
    }

    public function broadcastType(): string
    {
        return 'student_absent';
    }
}

