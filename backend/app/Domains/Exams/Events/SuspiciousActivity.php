<?php

declare(strict_types=1);

namespace App\Domains\Exams\Events;

use App\Domains\Exams\Models\ExamAttempt;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند رصد نشاط مشبوه أثناء الامتحان (tab switch، إلخ).
 * يُبث للمدرس Realtime عشان يشوف.
 */
class SuspiciousActivity implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ExamAttempt $attempt,
        public readonly string      $activityType, // 'tab_switch' | 'window_blur' | 'copy_paste'
        public readonly int         $count,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("exam.{$this->attempt->exam_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.suspicious';
    }

    public function broadcastWith(): array
    {
        return [
            'attempt_id'    => $this->attempt->id,
            'student_id'    => $this->attempt->student_id,
            'activity_type' => $this->activityType,
            'count'         => $this->count,
            'flagged'       => $this->count >= 3,
        ];
    }
}
