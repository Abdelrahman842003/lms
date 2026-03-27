<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Events;

use App\Domains\Lectures\Models\Lecture;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند إغلاق محاضرة → يُبث Realtime للطلاب.
 */
class LectureClosed implements ShouldBroadcastNow
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
        return 'lecture.closed';
    }

    public function broadcastWith(): array
    {
        return [
            'lecture_id' => $this->lecture->id,
            'group_id'   => $this->lecture->group_id,
            'closed_at'  => now()->toIso8601String(),
        ];
    }
}
