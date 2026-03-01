<?php

declare(strict_types=1);

namespace App\Domains\Exams\Notifications;

use App\Domains\Exams\Models\ExamResult;
use App\Domains\Notifications\Services\NotificationSettingsService;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Notification;

class ExamResultNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        protected ExamResult $result,
        protected array      $progress,
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
        $exam        = $this->result->exam;
        $percentage  = $this->result->percentage;
        $level       = $this->getPerformanceLevel((float) $percentage);
        $progressMsg = $this->progress['message'] ?? '';

        return [
            'title'      => 'نتيجة الامتحان: ' . $exam->title,
            'message'    => sprintf('درجتك: %s/%s (%s%%) - %s. %s', $this->result->score, $exam->max_score, $percentage, $level, $progressMsg),
            'type'       => 'exam_result',
            'exam_id'    => $exam->id,
            'exam_title' => $exam->title,
            'score'      => $this->result->score,
            'max_score'  => $exam->max_score,
            'percentage' => $percentage,
            'progress'   => $this->progress,
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->result->student_id),
        ];
    }

    private function getPerformanceLevel(float $percentage): string
    {
        return match (true) {
            $percentage >= 90 => 'ممتاز',
            $percentage >= 80 => 'جيد جداً',
            $percentage >= 70 => 'جيد',
            $percentage >= 60 => 'مقبول',
            default           => 'يحتاج تحسين',
        };
    }
}
