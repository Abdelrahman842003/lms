<?php

declare(strict_types=1);

namespace App\Domains\Exams\Notifications;

use App\Domains\Notifications\BaseNotification;
use App\Domains\Exams\Models\Exam;

class ExamActivatedNotification extends BaseNotification
{
    public function __construct(
        private Exam $exam,
    ) {}

    protected function getData(): array
    {
        return [
            'title'   => 'امتحان جديد متاح الآن! 📝',
            'message' => "تم تفعيل امتحان '{$this->exam->title}'. يمكنك البدء الآن.",
            'type'    => 'exam_activated',
            'exam_id' => $this->exam->id,
            'url'     => "/student/exams/{$this->exam->id}/take",
        ];
    }

    public function broadcastType(): string
    {
        return 'exam_activated';
    }
}
