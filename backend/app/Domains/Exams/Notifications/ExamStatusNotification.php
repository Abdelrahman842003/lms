<?php

declare(strict_types=1);

namespace App\Domains\Exams\Notifications;

use App\Domains\Notifications\BaseNotification;
use App\Domains\Exams\Models\Exam;

class ExamStatusNotification extends BaseNotification
{
    public function __construct(
        private Exam   $exam,
        private string $status, // 'active' | 'ended'
    ) {}

    protected function getData(): array
    {
        $statusText = $this->status === 'active' ? 'تم تفعيله الآن' : 'انتهى الآن';

        return [
            'title'     => 'تحديث حالة الامتحان',
            'message'   => "امتحان {$this->exam->title} {$statusText}",
            'type'      => 'exam_status',
            'exam_id'   => $this->exam->id,
            'status'    => $this->status,
            'is_active' => $this->exam->is_active,
        ];
    }

    public function broadcastType(): string
    {
        return 'exam_status';
    }
}
