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
 * يُطلق عند بدء محاولة امتحان → يُبث للمدرس Realtime.
 */
class ExamStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ExamAttempt $attempt,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("exam.{$this->attempt->exam_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.started';
    }

    public function broadcastWith(): array
    {
        return [
            'attempt_id' => $this->attempt->id,
            'student_id' => $this->attempt->student_id,
            'exam_id'    => $this->attempt->exam_id,
            'started_at' => $this->attempt->started_at?->toIso8601String(),
        ];
    }
}
