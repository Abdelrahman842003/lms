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
        $isAcademy = $this->lecture->academy_id !== null;
        $academyName = $isAcademy ? ($this->lecture->academy->name ?? 'الأكاديمية') : null;

        if ($this->status === 'active') {
            if ($isAcademy) {
                $message = "قامت {$academyName} بتفعيل محاضرة: {$this->lecture->title}";
            } else {
                $message = "تم تفعيل محاضرة {$this->lecture->title}";
            }
        } else {
            if ($isAcademy) {
                $message = "قامت {$academyName} بإنهاء محاضرة: {$this->lecture->title}";
            } else {
                $message = "تم إنهاء محاضرة {$this->lecture->title}";
            }
        }

        return [
            'title'      => 'تحديث حالة المحاضرة',
            'message'    => $message,
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
