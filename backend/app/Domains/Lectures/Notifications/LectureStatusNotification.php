<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Notifications;

use App\Domains\Notifications\BaseNotification;
use App\Domains\Lectures\Models\Lecture;

class LectureStatusNotification extends BaseNotification
{
    public function __construct(
        private Lecture $lecture,
        private string  $status, // 'active' | 'finished'
    ) {}

    protected function getData(): array
    {
        $statusText = $this->status === 'active' ? 'بدأت الآن' : 'انتهت الآن';

        return [
            'title'      => 'تحديث حالة المحاضرة',
            'message'    => "محاضرة {$this->lecture->title} {$statusText}",
            'type'       => 'lecture_status',
            'lecture_id' => $this->lecture->id,
            'status'     => $this->status,
        ];
    }

    public function broadcastType(): string
    {
        return 'lecture_status';
    }
}
