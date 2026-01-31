<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ExamResult;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Notifications\Notification;

class ExamResultNotification extends Notification implements ShouldBroadcast
{
    use Queueable;

    protected $result;
    protected $progress;

    /**
     * Create a new notification instance.
     */
    public function __construct(ExamResult $result, array $progress)
    {
        $this->result = $result;
        $this->progress = $progress;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database', 'broadcast', \App\Notifications\Channels\FcmChannel::class];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        $exam = $this->result->exam;
        $percentage = $this->result->percentage;
        
        // Determine performance level
        $performanceLevel = $this->getPerformanceLevel((float) $percentage);
        
        // Build progress message
        $progressMessage = $this->progress['message'] ?? '';
        
        return [
            'title' => 'نتيجة الامتحان: ' . $exam->title,
            'message' => sprintf(
                'درجتك: %s/%s (%s%%) - %s. %s',
                $this->result->score,
                $exam->max_score,
                $percentage,
                $performanceLevel,
                $progressMessage
            ),
            'type' => 'exam_result',
            'exam_id' => $exam->id,
            'exam_title' => $exam->title,
            'score' => $this->result->score,
            'max_score' => $exam->max_score,
            'percentage' => $percentage,
            'progress' => $this->progress,
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->result->student_id),
        ];
    }

    /**
     * Get performance level description
     */
    private function getPerformanceLevel(float $percentage): string
    {
        if ($percentage >= 90) {
            return 'ممتاز';
        } elseif ($percentage >= 80) {
            return 'جيد جداً';
        } elseif ($percentage >= 70) {
            return 'جيد';
        } elseif ($percentage >= 60) {
            return 'مقبول';
        } else {
            return 'يحتاج تحسين';
        }
    }
}
