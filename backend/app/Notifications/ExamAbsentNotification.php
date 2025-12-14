<?php

namespace App\Notifications;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\FcmChannel;

class ExamAbsentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $exam;

    public function __construct(Exam $exam)
    {
        $this->exam = $exam;
    }

    public function via($notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'تنبيه غياب عن الامتحان ⚠️',
            'message' => "لقد تم تسجيلك غياب في امتحان '{$this->exam->title}' لعدم حضورك في الوقت المحدد.",
            'type' => 'exam_absent',
            'exam_id' => $this->exam->id,
            'exam_title' => $this->exam->title,
        ];
    }
}
