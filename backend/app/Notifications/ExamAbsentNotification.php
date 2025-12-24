<?php

namespace App\Notifications;

use App\Models\Exam;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\FcmChannel;

class ExamAbsentNotification extends Notification implements ShouldBroadcast
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
            'title' => 'تنبيه غياب عن الامتحان ⚠️',
            'message' => "لقد تم تسجيلك غياب في امتحان '{$this->exam->title}' لعدم حضورك في الوقت المحدد.",
            'type' => 'exam_absent',
            'exam_id' => $this->exam->id,
            'exam_title' => $this->exam->title,
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->id),
        ];
    }
}
