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
 * يُطلق عند إنهاء الامتحان بنجاح → يُبث للمدرس + يُطلق GrantExamXp.
 */
class ExamCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ExamAttempt $attempt,
        public readonly float       $score,
        public readonly float       $percentage,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("exam.{$this->attempt->exam_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'exam.completed';
    }

    public function broadcastWith(): array
    {
        return [
            'attempt_id'   => $this->attempt->id,
            'student_id'   => $this->attempt->student_id,
            'score'        => $this->score,
            'percentage'   => $this->percentage,
            'completed_at' => $this->attempt->completed_at?->toIso8601String(),
        ];
    }
}
