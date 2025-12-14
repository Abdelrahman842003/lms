<?php

namespace App\Notifications;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\FcmChannel;

class ExamActivatedNotification extends Notification implements ShouldQueue
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
            'title' => 'امتحان جديد متاح الآن! 📝',
            'message' => "تم تفعيل امتحان '{$this->exam->title}'. يمكنك البدء الآن.",
            'type' => 'exam_activated',
            'exam_id' => $this->exam->id,
            'url' => "/student/exams/{$this->exam->id}/take"
        ];
    }
}
