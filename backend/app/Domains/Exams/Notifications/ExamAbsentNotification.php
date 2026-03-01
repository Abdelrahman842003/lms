<?php

declare(strict_types=1);

namespace App\Domains\Exams\Notifications;

use App\Domains\Exams\Models\Exam;
use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class ExamAbsentNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        protected Exam $exam,
    ) {}

    public function via(object $notifiable): array
    {
        return app(NotificationSettingsService::class)->channelsFor(
            $notifiable,
            ['database', 'broadcast'],
            true
        );
    }

    public function toArray($notifiable): array
    {
        return [
            'title'      => 'تنبيه غياب عن الامتحان ⚠️',
            'message'    => "لقد تم تسجيلك غياب في امتحان '{$this->exam->title}' لعدم حضورك في الوقت المحدد.",
            'type'       => 'exam_absent',
            'exam_id'    => $this->exam->id,
            'exam_title' => $this->exam->title,
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->exam->id),
        ];
    }
}
