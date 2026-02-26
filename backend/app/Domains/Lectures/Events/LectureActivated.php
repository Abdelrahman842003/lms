<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Events;

use App\Domains\Lectures\Models\Lecture;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند تفعيل محاضرة → يُبث Realtime لكل طلاب المجموعة.
 */
class LectureActivated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Lecture $lecture,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("group.{$this->lecture->group_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'lecture.activated';
    }

    public function broadcastWith(): array
    {
        return [
            'lecture_id' => $this->lecture->id,
            'title'      => $this->lecture->title,
            'group_id'   => $this->lecture->group_id,
            'teacher_id' => $this->lecture->teacher_id,
            'started_at' => now()->toIso8601String(),
        ];
    }
}
