<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use App\Domains\Notifications\BaseNotification;

class StudentAbsentNotification extends BaseNotification
{
    public function __construct(
        private string $lectureTitle,
        private string $teacherName,
        private string $academyName,
    ) {}

    protected function getData(): array
    {
        return [
            'title'         => 'تسجيل غياب',
            'message'       => "لقد تم تسجيلك غائب في محاضرة: {$this->lectureTitle} للمدرس {$this->teacherName} في أكاديمية {$this->academyName}",
            'type'          => 'absent',
            'lecture_title' => $this->lectureTitle,
            'teacher_name'  => $this->teacherName,
            'academy_name'  => $this->academyName,
        ];
    }

    public function broadcastType(): string
    {
        return 'student_absent';
    }
}
