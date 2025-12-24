<?php

namespace App\Notifications;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\FcmChannel;

class ExamActivatedNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    protected $exam;

    public function __construct(Exam $exam)
    {
        $this->exam = $exam;
    }

    public function via($notifiable): array
    {
        return ['database', 'broadcast', FcmChannel::class];
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

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->id),
        ];
    }
}
